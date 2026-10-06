"""全国展開の成果集計（件数のみ）。nat_build.py の後、nat_snapshot.sh nat/snap_after.json の後に実行。"""
import json, glob
from collections import Counter, defaultdict
from analyze import PREF_NAME
st = json.load(open("nat/stats.json"))
S = st["stats"]
q = Counter(); qp = Counter(); qpp = Counter()
for f in sorted(glob.glob("nat/log_r*.json")):
    for e in json.load(open(f)): q[e["pref"]] += 1; qp[e["pattern"]] += 1
ent = json.load(open("/home/user/name-missheaven-2026-map/data/entrants/national-2026-10-06.json"))
rows = []
for p in sorted(q, key=lambda p: -S.get(p, {}).get("entrants", 0)):
    s = S.get(p, {})
    excl = {k[5:]: v for k, v in s.items() if k.startswith("excl_")}
    rows.append(dict(pref=PREF_NAME[p], searches=q[p], valid=s.get("validPages", 0), newStores=s.get("newStores", 0), entrants=s.get("entrants", 0),
                     strengthened=s.get("existingStrengthened", 0), relations=s.get("newRelations", 0), newCats=s.get("newCategoryOriginal", 0),
                     area=s.get("areaFillExisting", 0) + s.get("newStoreArea", 0), areaExisting=s.get("areaFillExisting", 0), url=s.get("newStores", 0) + s.get("urlFillExisting", 0),
                     urlExisting=s.get("urlFillExisting", 0), excluded=sum(excl.values()), excl=excl, perSearch=round(s.get("entrants", 0) / q[p], 2),
                     storesNewlyWithEntrants=s.get("storesNewlyWithEntrants", 0)))
pat = Counter(); kind = Counter()
for p, s in S.items():
    for k, v in s.items():
        if k.startswith("pattern_"): pat[k[8:]] += v
        if k.startswith("kind_"): kind[k[5:]] += v
b = json.load(open("nat/snap_base.json")); a = json.load(open("nat/snap_after.json"))
tot = lambda snap: dict(stores=len(snap), storesWithEntrants=sum(1 for s in snap if s["entrants"]))
out = dict(rows=rows, totals=dict(searches=sum(q.values()), searchesByPattern=dict(qp), entrantsByPattern=dict(pat),
           perSearchByPattern={k: round(pat[k] / qp[k], 2) for k in qp}, evidenceKinds=dict(kind), excl=st["excl"],
           before=tot(b) | dict(entrants=len(json.load(open("nat/snap_base_entrants.json"))), categoryNames=len(json.load(open("nat/snap_base_cats.json")))),
           after=tot(a) | dict(entrants=len(json.load(open("nat/snap_after_entrants.json"))), categoryNames=len(json.load(open("nat/snap_after_cats.json")))),
           newStores=sum(r["newStores"] for r in rows), newEntrants=sum(r["entrants"] for r in rows), newRelations=sum(r["relations"] for r in rows),
           newCategoryOriginal=st["newCategoryOriginalCount"], areaFillExisting=sum(r["areaExisting"] for r in rows), urlFillExisting=sum(r["urlExisting"] for r in rows),
           newStoreArea=sum(S.get(p, {}).get("newStoreArea", 0) for p in S)))
json.dump(out, open("nat/report.json", "w"), ensure_ascii=False, indent=1)
for r in rows: print(r["pref"], r["searches"], r["valid"], r["newStores"], r["entrants"], r["strengthened"], r["relations"], r["newCats"], r["area"], r["url"], r["excluded"], r["perSearch"], r["excl"])
print(json.dumps(out["totals"], ensure_ascii=False))
