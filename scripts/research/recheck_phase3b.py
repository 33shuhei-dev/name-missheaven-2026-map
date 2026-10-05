"""Phase 3b の店舗を、保存済みの検索結果（shops_final.json）だけで再評価する。新たな検索はしない。

実用基準（2026-10-05 方針）
- 1ページの検索結果に「ミスヘブン」と、その近く（80字以内）に具体的な参加の記載
  （エントリー・ノミネート・出場・参戦・選出・挑戦・意気込み・○○部門・参加します 等）があれば「参加情報」1件として数える
- 「エントリー受付」「エントリー募集」など大会の一般告知、投票・応援キャンペーンの案内だけのページは数えない
- 参加情報のあるページが2件以上 → probable（表示：参加情報あり）、1件 → unverified（表示：参加情報を1件確認）
- 0件の店舗と、下の EXCLUDE に挙げた明らかな誤検出は data/phase3b から外し、recheck.json に理由を残す

使い方: python3 recheck_phase3b.py <shops_final.json> <data/phase3b ディレクトリ>
"""
import hashlib, json, os, re, sys, unicodedata
from collections import Counter

MH = re.compile(r"ミスヘブン")
SPECIFIC = re.compile(
    r"エントリー(?!受付|募集|方法)|ENTRY|ノミネート|NOMINEE|出場|出馬|参戦|意気込み|出ることに|選挙に出|名(?:が|の)?挑戦"
    r"|選出(?!歴)|挑戦|参加(?:いたし|させていただき|させて頂き|し)(?:ます|ました)|参加中|参加決定|ミスヘブン参加|[^\s、。()（）【】「」『』.]{1,16}部門",
    re.I,
)
NEAR = 80

# 自動判定を通っても、抜粋を読むと参加の記載ではないもの（人物名は記録しない）
EXCLUDE = {
    "aichi/A2301/A230104/aitokkyu2006": "抜粋は全店共通の告知バナーと「年間最高傑作ノミネート確実視」という宣伝文のみで、2026年の参加の記載ではない",
    "gifu/A2101/A210102/okusama-t": "抜粋は入賞のお礼（結果報告）で、2026年（投票は10/28開始）の参加の記載として読めない",
    "kagawa/A3701/A370101/love-chance": "抜粋は別店舗（人妻KISS）からのエントリー告知で、この店舗の参加の記載ではない",
}


def norm(s):
    return unicodedata.normalize("NFKC", s or "")


def is_specific(ev):
    t = norm(ev["title"]) + " ‖ " + norm(ev["snippet"])
    pos = [m.start() for m in MH.finditer(t)]
    return "2026" in t and any(abs(m.start() - p) <= NEAR for m in SPECIFIC.finditer(t) for p in pos)


def load(d, name):
    return json.load(open(os.path.join(d, name)))


def dump(d, name, obj):
    with open(os.path.join(d, name), "w") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)


def main(shops_final, out_dir):
    shops = {x["key"]: x for x in json.load(open(shops_final))["shops"]}
    stores_doc = load(out_dir, "stores.json")
    rel_doc = load(out_dir, "store_category_relations.json")
    src_doc = load(out_dir, "store_sources.json")
    cov_doc = load(out_dir, "coverage_47prefectures.json")

    kept, excluded, changed = [], [], []
    for s in stores_doc["stores"]:
        key = s["cityheavenKey"]
        ev = shops[key]["evidence"]
        n = sum(1 for e in ev if is_specific(e))
        reason = EXCLUDE.get(key) or (None if n else "抜粋が大会の一般告知・応援キャンペーンの案内のみで、この店舗の参加の記載がない")
        if reason:
            excluded.append({"storeId": s["storeId"], "storeName": s["storeName"], "prefecture": s["prefecture"], "storePublicUrl": s["storePublicUrl"], "reason": reason})
            continue
        conf = "probable" if n >= 2 else "unverified"
        if n != s["evidencePageCount"] or conf != s["confidence"]:
            changed.append({"storeId": s["storeId"], "storeName": s["storeName"], "from": [s["confidence"], s["evidencePageCount"]], "to": [conf, n]})
        s["evidencePageCount"] = n
        s["confidence"] = conf
        s["fieldConfidence"]["participation"] = conf
        s["verificationMethod"] = "search_index_multiple" if n >= 2 else "search_index_single"
        kept.append(s)

    gone = {x["storeId"] for x in excluded}
    stores_doc["stores"] = kept
    rel_doc["relations"] = [r for r in rel_doc["relations"] if r["storeId"] not in gone]
    for src in src_doc["sources"]:
        src["storeIds"] = [i for i in src["storeIds"] if i not in gone]
    src_doc["sources"] = [x for x in src_doc["sources"] if x["storeIds"]]

    by_pref = {}
    for s in kept:
        by_pref.setdefault(s["prefecture"], Counter())[s["confidence"]] += 1
    for c in cov_doc["prefectures"]:
        cnt = by_pref.get(c["prefecture"], Counter())
        c["newStores"] = sum(cnt.values())
        c["storesFound"] = c["newStores"] + c["matchedExisting"]
        c["byConfidence"] = dict(cnt)
        if c["storesFound"] == 0:
            c["dataStatus"] = "insufficient"

    sm = stores_doc["summary"]
    sm["newStores"] = len(kept)
    sm["byConfidence"] = dict(Counter(s["confidence"] for s in kept))
    sm["byVerificationMethod"] = dict(Counter(s["verificationMethod"] for s in kept))
    sm["relations"] = len(rel_doc["relations"])
    sm["categoryOriginals"] = len({r["categoryOriginal"] for r in rel_doc["relations"]})
    sm["prefecturesWithStores"] = sum(1 for c in cov_doc["prefectures"] if c["storesFound"] > 0)
    sm["prefecturesInsufficient"] = [c["prefecture"] for c in cov_doc["prefectures"] if c["dataStatus"] == "insufficient"]
    sm["recheck"] = {"checkedAt": "2026-10-05", "excluded": len(excluded), "confidenceChanged": len(changed)}

    dump(out_dir, "stores.json", stores_doc)
    dump(out_dir, "store_category_relations.json", rel_doc)
    dump(out_dir, "store_sources.json", src_doc)
    dump(out_dir, "coverage_47prefectures.json", cov_doc)
    dump(out_dir, "recheck.json", {
        "checkedAt": "2026-10-05",
        "method": "保存済みの検索結果の抜粋を再読。新たな検索・CityHeaven への直接アクセスはしていない。",
        "criteria": __doc__.split("\n\n")[1].strip(),
        "excluded": excluded,
        "confidenceChanged": changed,
    })
    names = sorted(f for f in os.listdir(out_dir) if f != "SHA256SUMS")
    with open(os.path.join(out_dir, "SHA256SUMS"), "w") as f:
        for name in names:
            f.write(f"{hashlib.sha256(open(os.path.join(out_dir, name), 'rb').read()).hexdigest()}  {name}\n")
    print("kept", len(kept), sm["byConfidence"], "excluded", len(excluded), "changed", len(changed))
    for x in excluded:
        print("  excluded", x["prefecture"], x["storeName"], "-", x["reason"])
    for x in changed:
        print("  changed", x["storeName"], x["from"], "->", x["to"])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
