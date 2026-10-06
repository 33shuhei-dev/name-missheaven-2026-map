import json, re, unicodedata
from collections import Counter
REPO = "/home/user/name-missheaven-2026-map"
n = lambda s: unicodedata.normalize("NFKC", s or "")
m = json.load(open("merged_entrants.json"))
# 「その他のページ」（店舗・本人・転載のいずれでもない）は根拠に使わない。その情報源しかない人物は記録しない
for f in m["final"]:
    f["items"] = [x for x in f["items"] if (x["kind"] or "other") != "other"]
dropped_other = sum(1 for f in m["final"] if not f["items"])
m["final"] = [f for f in m["final"] if f["items"]]
for f in m["final"]:
    cats = [x["category"] for x in f["items"] if x["category"]]
    f["category"] = Counter(cats).most_common(1)[0][0] if cats else None
items = {o["cid"]: o for j in range(4) for o in json.load(open(f"batch_{j}.json"))}
# 既存の店舗×部門関係
rels = set()
for f, k in [("data/phase3/store_category_relations.json", "relations"), ("data/phase3b/store_category_relations.json", "relations")]:
    for r in json.load(open(f"{REPO}/{f}"))[k]: rels.add((r["storeId"], r["categoryOriginal"]))
ts = open(f"{REPO}/data/store-updates.ts").read() + open(f"{REPO}/data/entrant-updates.ts").read()
for sid, cat in re.findall(r'storeId: "([^"]+)",\n    categoryOriginal: "([^"]+)",\n    categoryNormalized', ts): rels.add((sid, cat))

ROLE = {"own_page": ("entrant_diary", "entrant_page"), "own_diary": ("entrant_diary", "entrant_page"), "other_entrant": ("entrant_diary", "entrant_page"),
        "store_notice": ("store", "store_announcement"), "mirror": ("other", "third_party_mirror"), "other": ("other", "search_engine_result")}
KIND_JA = {"own_page": "本人のページ", "own_diary": "本人の写メ日記", "other_entrant": "同じ店舗の出場者のページ", "store_notice": "店舗の告知", "mirror": "転載サイト", "other": "その他のページ"}
sources = {}; entrants = []; relations = []; new_rel = {}
def evidence_of(x):
    it = items[x["cid"]]; text = n(it["title"]) + " " + n(it["snippet"]); q = n(x["quote"])
    if "2026" not in q and not x["date"]:
        i = text.find("2026"); start = max(0, text.rfind(".", 0, i) + 1, i - 30)
        head = text[start:i + 25].strip(" .·")
        q = f"{head} … {q}"
    return f"{KIND_JA.get(x['kind'], 'ページ')}に「{q.strip()}」"
for i, f in enumerate(sorted(m["final"], key=lambda f: (f["prefecture"] or "", f["storeName"], f["name"]))):
    sids = []
    for x in f["items"]:
        url = x["url"]
        if url not in sources:
            stype, role = ROLE.get(x["kind"] or "other", ROLE["other"])
            sources[url] = dict(sourceId=f"ent-src-{1001 + len(sources)}", url=url, sourceType=stype, accessStatus="search_index_only", publisherRole=role,
                                storeIds=[], relationIds=[], checkedAt="2026-10-05",
                                notes="Yahoo!検索の結果の抜粋で確認（ページ本文は調査環境から取得していない）。Phase 3b の保存済み検索結果の全国再解析（2026-10-06）")
        src = sources[url]
        if f["storeId"] not in src["storeIds"]: src["storeIds"].append(f["storeId"])
        if src["sourceId"] not in sids: sids.append(src["sourceId"])
    cat = f["category"]
    first = f["items"][0]
    ev_items = [x for x in f["items"] if not cat or x["category"] == cat] or f["items"]
    ev = evidence_of(ev_items[0])
    date = next((x["date"] for x in f["items"] if x["date"]), None)
    if "2026" in ev: date = None
    notes = None
    if cat and (f["storeId"], cat) not in rels:
        k = (f["storeId"], cat)
        if k not in new_rel:
            new_rel[k] = dict(relationId=f"ent-rel-{1001 + len(new_rel)}", storeId=f["storeId"], categoryOriginal=cat, categoryNormalized=None, confidence="unverified",
                              sourceIds=[], phase1RecordIds=[], notes="出場者の根拠（同じ情報源）に店舗・人物・部門が書かれている（全国再解析）")
        for x in ev_items:
            sid = sources[x["url"]]["sourceId"]
            if x["category"] == cat and sid not in new_rel[k]["sourceIds"]: new_rel[k]["sourceIds"].append(sid)
        notes = "店舗×部門関係は同じ根拠から追加（entrantRelations）"
    entrants.append(dict(entrantId=f"mh26-ent-{1001 + i}", name=f["name"], storeId=f["storeId"], sourceIds=sids, evidence=ev, evidenceDate=date,
                         categoryOriginal=cat, personalUrl=None, confidence="unverified", checkedAt="2026-10-05", notes=notes))
out = dict(
    description="Phase 3b の保存済み検索結果の全国再解析（2026-10-06）で記録した出場者。新たな検索はしていない。神奈川県は data/entrant-updates.ts の実証分。",
    entrants=entrants, sources=list(sources.values()), relations=list(new_rel.values()))
json.dump(out, open(f"{REPO}/data/entrants/nationwide-reanalysis-2026-10-06.json", "w"), ensure_ascii=False, indent=1)
print("dropped (other-only)", dropped_other, "entrants", len(entrants), "sources", len(sources), "new relations", len(new_rel), "with category", sum(1 for e in entrants if e["categoryOriginal"]), "dated", sum(1 for e in entrants if e["evidenceDate"]))
print(Counter(x["kind"] for f in m["final"] for x in f["items"]))
