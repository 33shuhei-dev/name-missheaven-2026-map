"""3県パイロット：検証済みの人物を出場者の記録にする（重複除外・部門は原文・店舗×部門関係は同じ根拠のときだけ）。件数だけ表示する。"""
import json, re, hashlib, unicodedata
from collections import Counter, defaultdict
REPO = "/home/user/name-missheaven-2026-map"
n = lambda s: unicodedata.normalize("NFKC", s or "")
nm = lambda s: re.sub(r"[\s・･☆★♡♥❤()（）~～〜♪]", "", n(s)).lower()
items = {o["cid"]: o for o in json.load(open("pilot3_items.json"))}
ver = json.load(open("pilot3_verified.json")); nk = json.load(open("pilot3_newkeys.json"))
stores_by_id = {}
for f, k in [("data/phase3/participating_stores_2026.json", "stores"), ("data/phase3b/stores.json", "stores"), ("data/stores/pilot3-2026-10-06.json", "stores")]:
    for s in json.load(open(f"{REPO}/{f}"))[k]: stores_by_id[s["storeId"]] = s
# 既存の出場者（記録済み＋Phase 1 観測）
known = set()
nat = json.load(open(f"{REPO}/data/entrants/nationwide-reanalysis-2026-10-06.json"))
ts = open(f"{REPO}/data/entrant-updates.ts").read()
for e in nat["entrants"]: known.add((e["storeId"], nm(e["name"])))
for name, sid in re.findall(r'name: "([^"]+)",\n    storeId: "([^"]+)"', ts): known.add((sid, nm(name)))
p1 = set()
for r in json.load(open(f"{REPO}/data/phase1/nationwide_dataset_v1.json"))["records"]:
    for e in (r.get("entrantNames") or ([r["entrantName"]] if r.get("entrantName") else [])):
        p1.add((n(r.get("prefecture") or r.get("storePrefecture") or ""), nm(r.get("storeName")), nm(e)))
rels = set()
for f in ["data/phase3/store_category_relations.json", "data/phase3b/store_category_relations.json"]:
    for r in json.load(open(f"{REPO}/{f}"))["relations"]: rels.add((r["storeId"], r["categoryOriginal"]))
for r in nat["relations"]: rels.add((r["storeId"], r["categoryOriginal"]))
for sid, cat in re.findall(r'storeId: "([^"]+)",\n    categoryOriginal: "([^"]+)",\n    categoryNormalized', ts + open(f"{REPO}/data/store-updates.ts").read()): rels.add((sid, cat))
KIND = {"own_page": ("本人のページ", "entrant_diary", "entrant_page"), "own_diary": ("本人の写メ日記", "entrant_diary", "entrant_page"),
        "other_entrant": ("同じ店舗の出場者のページ", "entrant_diary", "entrant_page"), "store_notice": ("店舗の告知", "store", "store_announcement"),
        "mirror": ("転載サイト", "other", "third_party_mirror")}
stats = Counter()
groups = defaultdict(list)
for p in ver["persons"]:
    if p["kind"] not in KIND: stats["skip_kind"] += 1; continue
    sid = p["storeId"]
    if not sid:
        if nk.get(p["key"], {}).get("status") != "add": stats["skip_store_not_added"] += 1; continue
        sid = "mh26-pl3-store-" + hashlib.sha256(p["key"].encode()).hexdigest()[:16]
    groups[(sid, nm(p["name"]))].append(p)
sources, entrants, new_rel = {}, [], {}
def evidence(p):
    it = items[p["cid"]]; text = n(it["title"]) + " " + n(it["snippet"]); q = n(p["quote"])
    if "2026" not in q and not p["date"]:
        i = text.find("2026"); start = max(0, text.rfind(".", 0, i) + 1, i - 30)
        q = f"{text[start:i + 25].strip(' .·')} … {q}"
    return f"{KIND[p['kind']][0]}に「{q.strip()}」"
for (sid, key), ps in sorted(groups.items(), key=lambda kv: (stores_by_id[kv[0][0]]["prefecture"], stores_by_id[kv[0][0]]["storeName"], kv[0][1])):
    st = stores_by_id[sid]
    if (sid, key) in known: stats["dup_recorded"] += 1; continue
    if (n(st["prefecture"]), nm(st["storeName"]), key) in p1: stats["dup_phase1"] += 1; continue
    sids = []
    for p in ps:
        if p["url"] not in sources:
            _, stype, role = KIND[p["kind"]]
            sources[p["url"]] = dict(sourceId=f"ent-src-{2001 + len(sources)}", url=p["url"], sourceType=stype, accessStatus="search_index_only", publisherRole=role,
                                     storeIds=[], relationIds=[], checkedAt="2026-10-06",
                                     notes="Yahoo!検索の結果の抜粋で確認（ページ本文は調査環境から取得していない）。3都道府県パイロット（2026-10-06）")
        s = sources[p["url"]]
        if sid not in s["storeIds"]: s["storeIds"].append(sid)
        if s["sourceId"] not in sids: sids.append(s["sourceId"])
    cats = Counter(p["category"] for p in ps if p["category"])
    cat = cats.most_common(1)[0][0] if cats else None
    evp = [p for p in ps if not cat or p["category"] == cat] or ps
    ev = evidence(evp[0])
    date = None if "2026" in ev else next((p["date"] for p in evp if p["date"]), None)
    notes = None
    if cat and (sid, cat) not in rels:
        k = (sid, cat)
        if k not in new_rel:
            new_rel[k] = dict(relationId=f"ent-rel-{2001 + len(new_rel)}", storeId=sid, categoryOriginal=cat, categoryNormalized=None, confidence="unverified",
                              sourceIds=[], phase1RecordIds=[], notes="出場者の根拠（同じ情報源）に店舗・人物・部門が書かれている（3都道府県パイロット）")
        for p in evp:
            s = sources[p["url"]]["sourceId"]
            if s not in new_rel[k]["sourceIds"]: new_rel[k]["sourceIds"].append(s)
        notes = "店舗×部門関係は同じ根拠から追加（entrantRelations）"
    entrants.append(dict(entrantId=f"mh26-ent-{2001 + len(entrants)}", name=ps[0]["name"], storeId=sid, sourceIds=sids, evidence=ev, evidenceDate=date,
                         categoryOriginal=cat, personalUrl=None, confidence="unverified", checkedAt="2026-10-06", notes=notes))
    stats["pref_" + ps[0]["pref"]] += 1
for r in new_rel.values():
    for s in sources.values():
        if s["sourceId"] in r["sourceIds"] and r["relationId"] not in s["relationIds"]: s["relationIds"].append(r["relationId"])
json.dump(dict(description="3都道府県パイロット（大阪府・宮城県・青森県、2026-10-06）で記録した出場者。検索結果の抜粋で、2026年の出場・エントリーと店舗が確認できたものだけ。部門は原文のまま。",
               entrants=entrants, sources=list(sources.values()), relations=list(new_rel.values())),
          open(f"{REPO}/data/entrants/pilot3-2026-10-06.json", "w"), ensure_ascii=False, indent=1)
newcats_site = {c for _, c in rels}
print(dict(stats), "entrants", len(entrants), "with category", sum(1 for e in entrants if e["categoryOriginal"]),
      "stores with entrants", len({e["storeId"] for e in entrants}), "new relations", len(new_rel),
      "new categoryOriginal", len({c for _, c in new_rel} - newcats_site), "sources", len(sources))
