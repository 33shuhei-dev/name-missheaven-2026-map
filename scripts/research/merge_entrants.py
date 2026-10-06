import json, re, unicodedata
from collections import defaultdict, Counter
REPO = "/home/user/name-missheaven-2026-map"
n = lambda s: unicodedata.normalize("NFKC", s or "")
key = lambda s: re.sub(r"[\s・･/／、，,.。:：;；!！?？~～〜♡♥❤♪☆★◆◇■□●○※'\"`’”「」『』（）()［］\[\]【】〔〕{}｛｝<>＜＞\-‐－_＿|｜+＋&＆#＃*＊]", "", n(s).lower())
items = {o["cid"]: o for j in range(4) for o in json.load(open(f"batch_{j}.json"))}
dec = [d for j in range(4) for d in json.load(open(f"decisions_{j}.json"))]
OVERRIDE_EXCLUDE = {"c0345": "other_store", "c0071": "year_unknown", "c0141": "other_store", "c0218": "sns_no_store"}
CATEGORY_NULL = {("c0214", "もも"), ("c0151", "へれな")}

# 店舗
stores = {}
for f in ["data/phase3/participating_stores_2026.json", "data/phase3b/stores.json"]:
    d = json.load(open(f"{REPO}/{f}")); d = d["stores"] if isinstance(d, dict) else d
    for s in d: stores[s["storeId"]] = s
# 既存の出場者（Phase 1 と記録済み）
p1 = json.load(open(f"{REPO}/data/phase1/nationwide_dataset_v1.json"))["records"]
existing = set()
for r in p1:
    names = r.get("entrantNames") or ([r["entrantName"]] if r.get("entrantName") else [])
    for nm in names: existing.add((r.get("prefecture"), key(r.get("storeName")), key(nm)))
rec_names = set(re.findall(r'name: "([^"]+)",\n    storeId: "([^"]+)"', open(f"{REPO}/data/entrant-updates.ts").read()))
existing_rec = {(sid, key(nm)) for nm, sid in rec_names}

problems = []; accepted = []; excluded = Counter()
for d in dec:
    cid = d["cid"]; it = items[cid]
    if d.get("decision") != "accept":
        excluded[d.get("reason", "?")] += 1; continue
    if cid in OVERRIDE_EXCLUDE:
        excluded[OVERRIDE_EXCLUDE[cid]] += 1; continue
    text = n(it["title"]) + " " + n(it["snippet"])
    q = n(d.get("evidenceQuote"))
    if not q or q not in text: problems.append((cid, "quote not verbatim")); continue
    nm = d["name"].strip()
    if key(nm) not in key(text): problems.append((cid, f"name not in text: {nm}")); continue
    if d["storeId"] != it["storeId"]: problems.append((cid, "store mismatch")); continue
    cat = d.get("category")
    if (cid, nm) in CATEGORY_NULL: cat = None
    if cat and (not cat.endswith("部門") or key(cat) not in key(text)): cat = None
    date = d.get("evidenceDate")
    if "2026" not in q and not (date and re.match(r"^2026-(08|09|10)-\d\d$", date)):
        if "2026" in text and not date: pass  # 2026 は同じ抜粋の中にある（quote外）
        else: problems.append((cid, "no 2026 basis")); continue
    accepted.append(dict(cid=cid, name=nm, storeId=it["storeId"], category=cat, quote=d["evidenceQuote"], date=date if "2026" not in text else None,
                         kind=d.get("sourceKind"), url=it["url"], title=it["title"]))
print("problems", len(problems), problems[:20])
# 重複の統合（同じ店舗・同じ名前）
groups = defaultdict(list)
for a in accepted: groups[(a["storeId"], key(a["name"]))].append(a)
final = []; dup_existing = []
for (sid, k), lst in groups.items():
    s = stores[sid]
    if (s.get("prefecture"), key(s["storeName"]), k) in existing or (sid, k) in existing_rec:
        dup_existing.append((s["storeName"], lst[0]["name"])); continue
    cats = [x["category"] for x in lst if x["category"]]
    final.append(dict(name=lst[0]["name"], storeId=sid, storeName=s["storeName"], prefecture=s.get("prefecture"),
                      category=Counter(cats).most_common(1)[0][0] if cats else None, items=lst))
print("accepted rows", len(accepted), "people", len(groups), "dup existing", len(dup_existing), "new", len(final))
print("excluded", sum(excluded.values()), excluded.most_common())
json.dump(dict(final=final, dup_existing=dup_existing, excluded=excluded, problems=problems), open("merged_entrants.json", "w"), ensure_ascii=False, indent=1)
