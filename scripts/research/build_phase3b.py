"""Phase 3b 成果物の生成：発見店舗を既存（Phase 3・差分更新・応援店）と照合し、店舗・関係・情報源・カバレッジ・調査ログを出力する。
人物名・人物ページURL・抜粋本文は出力しない。"""
import hashlib, json, os, re, sys, unicodedata, urllib.parse
from collections import Counter, defaultdict
sys.path.insert(0, ".")
from analyze import PREF_NAME

REPO = "/home/user/name-missheaven-2026-map"
OUT = os.path.join(REPO, "data", "phase3b")
CHECKED = "2026-10-05"

def nname(s):
    s = unicodedata.normalize("NFKC", s or "").lower()
    s = re.sub(r"[（(][^）)]*[）)]", "", s)
    return re.sub(r"[\s・･\-－―ー_.,、。'\"`~〜!！?？☆★♪♡♥]", "", s)

def sid(prefix, key):
    return prefix + hashlib.sha1(key.encode()).hexdigest()[:16]

def yahoo_url(q):
    return "https://search.yahoo.co.jp/search?ei=UTF-8&p=" + urllib.parse.quote(q)

def main():
    shops = json.load(open("shops_final.json"))["shops"]
    plan = json.load(open("query_plan.json"))
    p3 = json.load(open(os.path.join(REPO, "data/phase3/participating_stores_2026.json")))["stores"]
    p3src = json.load(open(os.path.join(REPO, "data/phase3/store_sources.json")))["sources"]
    camp = json.load(open(os.path.join(REPO, "data/phase3/campaign_support_stores.json")))["stores"]
    upd_ts = open(os.path.join(REPO, "data/store-updates.ts"), encoding="utf-8").read()
    upd = [{"storeId": a, "storeName": b, "prefecture": c} for a, b, c in re.findall(r'storeId: "([^"]+)",\s*storeName: "([^"]+)",[\s\S]*?prefecture: "([^"]+)"', upd_ts)]

    existing = []  # (storeId, pref, normalized names, cityheaven keys)
    for s in p3:
        keys = set()
        urls = [s.get("storePublicUrl") or "", s.get("participationEvidenceUrl") or ""] + [x["url"] for x in p3src if s["storeId"] in x["storeIds"]]
        for u in urls:
            m = re.search(r"cityheaven\.net/([a-z]+/A\d{4}/A\d{6}/[A-Za-z0-9_\-]+)", u)
            if m: keys.add(m.group(1))
        existing.append({"id": s["storeId"], "origin": "phase3", "pref": s["prefecture"], "names": {nname(n) for n in s["storeNameOriginals"]}, "keys": keys, "name": s["storeName"]})
    for s in upd:
        m = re.search(r'storeId: "%s"[\s\S]*?storePublicUrl: "([^"]+)"' % re.escape(s["storeId"]), upd_ts)
        keys = set()
        if m:
            mm = re.search(r"cityheaven\.net/([a-z]+/A\d{4}/A\d{6}/[A-Za-z0-9_\-]+)", m.group(1))
            if mm: keys.add(mm.group(1))
        existing.append({"id": s["storeId"], "origin": "update", "pref": s["prefecture"], "names": {nname(s["storeName"])}, "keys": keys, "name": s["storeName"]})
    camp_names = {(c["prefecture"], nname(c["storeName"])) for c in camp}

    stores, relations, sources, matched, skipped = [], [], [], [], []
    for sh in shops:
        pref = PREF_NAME[sh["prefSlug"]]
        if not sh.get("name"):
            skipped.append({"key": sh["key"], "reason": "店名を特定できない"}); continue
        nn = {nname(sh["name"])} | {nname(n) for n in sh.get("nameVariants", [])}
        def name_match(e):
            if e["pref"] != pref:
                return False
            if e["names"] & nn:
                return True
            # 5文字以上の店名は、一方が他方を含む場合も同一店舗とみなす（グループ名の前置き等）
            return any(len(a) >= 5 and len(b) >= 5 and (a in b or b in a) for a in e["names"] for b in nn)
        hit = next((e for e in existing if sh["key"] in e["keys"] or name_match(e)), None)
        if hit:
            matched.append({"key": sh["key"], "name": sh["name"], "prefecture": pref, "existingStoreId": hit["id"], "existingOrigin": hit["origin"], "evidencePageCount": sh["evidencePageCount"]})
            continue
        if (pref, nname(sh["name"])) in camp_names:
            skipped.append({"key": sh["key"], "reason": "応援キャンペーンのみの店舗と同名"}); continue
        same_name_unknown = [e["id"] for e in existing if e["pref"] is None and e["names"] & nn]
        store_id = sid("mh26-p3b-store-", sh["key"])
        q = f"site:www.cityheaven.net/{sh['key']}/ ミスヘブン 2026"
        evidence_query = yahoo_url(q)
        shop_level = [e["url"] for e in sh["evidence"] if e["kind"] in ("shop_top", "shop_event", "shop_other")]
        evidence_url = shop_level[0] if shop_level else evidence_query
        n = sh["evidencePageCount"]
        conf = "probable" if n >= 2 else "unverified"
        src_ids = []
        sq = sid("p3b-src-", "q|" + sh["key"])
        sources.append({"sourceId": sq, "url": evidence_query, "sourceType": "other", "accessStatus": "search_index_only", "publisherRole": "search_engine_result", "storeIds": [store_id], "relationIds": [], "checkedAt": CHECKED, "notes": f"店舗パス限定の検索。2026年の参加を示した店舗ページ {n}件（人物ページを含む）。"})
        src_ids.append(sq)
        if shop_level:
            se = sid("p3b-src-", "e|" + shop_level[0])
            sources.append({"sourceId": se, "url": shop_level[0], "sourceType": "store", "accessStatus": "search_index_only", "publisherRole": "store_announcement", "storeIds": [store_id], "relationIds": [], "checkedAt": CHECKED, "notes": "店舗ページ（ヘブン掲載）の検索結果抜粋で2026年の参加の記載を確認。本文は調査環境から取得不可。"})
            src_ids.append(se)
        cats = sorted(sh.get("categories", {}).keys())
        for c in cats:
            rid = sid("p3b-rel-", sh["key"] + "|" + c)
            urls = sh["categories"][c]
            relations.append({"relationId": rid, "storeId": store_id, "categoryOriginal": c, "categoryNormalized": None, "confidence": "probable" if (conf == "probable" and len(urls) >= 2) else "unverified", "sourceIds": [sq], "phase1RecordIds": [], "notes": f"検索結果の抜粋に記載された部門名（原文）。{len(urls)}ページで確認。店舗の全員がこの部門という意味ではない。"})
            sources[-1 if not shop_level else -2]["relationIds"].append(rid)
        best_kind = "store" if shop_level else "entrant_diary"
        stores.append({
            "storeId": store_id, "storeName": sh["name"], "storeNameOriginals": sorted({sh["name"], *sh.get("nameVariants", [])}),
            "prefecture": pref, "listingArea": sh.get("listingArea"), "listingAreas": [sh["listingArea"]] if sh.get("listingArea") else [],
            "formalElectionArea": None, "categoryOriginal": cats[0] if len(cats) == 1 else None, "categoryOriginals": cats,
            "participationEvidenceUrl": evidence_url, "storePublicUrl": sh["storeUrl"], "sourceType": best_kind,
            "confidence": conf, "participationType": "search_index_reported", "checkedAt": CHECKED, "reviewedAt": CHECKED,
            "phase1RecordIds": [], "phase2RecordIds": [], "isNewSincePhase1": True, "sourceIds": src_ids,
            "publicUrlAccessStatus": "unknown", "verificationMethod": "search_index_multiple" if n >= 2 else "search_index_single",
            "evidencePageCount": n, "cityheavenKey": sh["key"],
            "fieldConfidence": {"participation": conf, "prefecture": "probable", "listingArea": "probable" if sh.get("listingArea") else "unverified", "formalElectionArea": "unverified"},
            "possibleSameStoreAsUnknownPrefecture": same_name_unknown,
            "notes": f"Phase 3b 全国走査（{CHECKED}）。Yahoo!検索の結果で、ヘブン掲載のこの店舗のページ{n}件に「ミスヘブン（総選挙）2026」と参加を示す記載を確認。ページ本文は調査環境から取得できない（403）ため、検索結果の抜粋による。都道府県はヘブンの掲載URL、掲載地域はページタイトルの表記による。正式選挙エリアは未確認。" + ("同名の県不明店舗が既存データにあるが、同一と確認できないため統合していない。" if same_name_unknown else ""),
        })

    # 47都道府県カバレッジ
    coverage = []
    for slug, name in PREF_NAME.items():
        qs = [x for x in plan if x["tag"] == f"pref:{slug}"]
        st = [s for s in stores if s["prefecture"] == name]
        mt = [m for m in matched if m["prefecture"] == name]
        found = len(st) + len(mt)
        coverage.append({
            "prefecture": name, "prefSlug": slug,
            "researchStatus": "searched" if qs and all(not x.get("error") for x in qs) else "not_searched",
            "queryCount": len({x["query"] for x in qs}), "pageCount": len(qs), "resultCount": sum(x["resultCount"] for x in qs),
            "storesFound": found, "newStores": len(st), "matchedExisting": len(mt),
            "byConfidence": dict(Counter(s["confidence"] for s in st)),
            "dataStatus": "found" if found else "insufficient",
        })
    summary = {
        "newStores": len(stores), "matchedExistingStores": len(matched), "skipped": len(skipped),
        "byConfidence": dict(Counter(s["confidence"] for s in stores)),
        "byVerificationMethod": dict(Counter(s["verificationMethod"] for s in stores)),
        "relations": len(relations), "categoryOriginals": len({r["categoryOriginal"] for r in relations}),
        "prefecturesSearched": sum(1 for c in coverage if c["researchStatus"] == "searched"),
        "prefecturesWithStores": sum(1 for c in coverage if c["storesFound"]),
        "prefecturesInsufficient": [c["prefecture"] for c in coverage if not c["storesFound"]],
        "queriesExecuted": len({x["query"] for x in plan}), "searchPagesFetched": len(plan),
        "possibleSameStoreAsUnknownPrefecture": sum(1 for s in stores if s["possibleSameStoreAsUnknownPrefecture"]),
    }
    os.makedirs(OUT, exist_ok=True)
    meta = {"schemaVersion": "1.0.0", "event": "ミスヘブン総選挙2026", "phase": "Phase3b_nationwide_search_sweep", "checkedAt": CHECKED,
            "scope": "検索エンジンの索引で、ヘブン掲載の店舗ページに2026年の参加の記載が確認できた店舗。全参加店舗の網羅ではない。個人名簿ではない。"}
    json.dump({**meta, "summary": summary, "stores": stores}, open(os.path.join(OUT, "stores.json"), "w"), ensure_ascii=False, indent=1)
    json.dump({**meta, "relations": relations}, open(os.path.join(OUT, "store_category_relations.json"), "w"), ensure_ascii=False, indent=1)
    json.dump({**meta, "sources": sources}, open(os.path.join(OUT, "store_sources.json"), "w"), ensure_ascii=False, indent=1)
    json.dump({**meta, "prefectures": coverage}, open(os.path.join(OUT, "coverage_47prefectures.json"), "w"), ensure_ascii=False, indent=1)
    json.dump({**meta, "matchedExisting": matched, "skipped": skipped, "queries": plan}, open(os.path.join(OUT, "research_log.json"), "w"), ensure_ascii=False, indent=1)
    print(json.dumps(summary, ensure_ascii=False, indent=1))

if __name__ == "__main__":
    main()
