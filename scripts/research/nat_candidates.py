"""全国展開：検索結果を 店舗（既存／新規候補）・掲載地域・URL・人物候補 の視点で整理し、レビュー用に分割する。
使い方: python3 nat_candidates.py ROUND SNAPSHOT CHUNK"""
import json, re, sys, glob, os, unicodedata
from collections import defaultdict, Counter
sys.path.insert(0, ".")
from analyze import SHOP_RE, page_kind, title_name_area
REPO = "/home/user/name-missheaven-2026-map"
ROUND, SNAP, CHUNK = sys.argv[1], sys.argv[2], int(sys.argv[3])
n = lambda s: unicodedata.normalize("NFKC", s or "")
nu = lambda u: u.split("#")[0].replace("smart.cityheaven", "www.cityheaven").replace("/t/", "/").rstrip("/")
key2store, stores = {}, {}
for s in json.load(open(f"{REPO}/data/phase3b/stores.json"))["stores"]: key2store[s["cityheavenKey"]] = s["storeId"]
for m in json.load(open(f"{REPO}/data/phase3b/research_log.json"))["matchedExisting"]: key2store[m["key"]] = m["existingStoreId"]
for s in json.load(open(SNAP)):
    stores[s["id"]] = s
    m = SHOP_RE.match(s["url"] or "")
    if m: key2store.setdefault("/".join(m.groups()[:4]), s["id"])
prior = set()
for f in ["log_pref.json", "log_queue.json", "log_groupA.json", "log_kanagawa_followup.json", "log_pilot3.json"] + sorted(glob.glob("nat/log_*.json")):
    if not f.endswith(f"log_{ROUND}.json"):
        for e in json.load(open(f)):
            for r in e.get("results", []): prior.add(nu(r["url"]))
logs = json.load(open(f"nat/log_{ROUND}.json"))
rows = [dict(r, pattern=e["pattern"], pref=e["pref"]) for e in logs for r in e["results"]]
seen = {}
for r in rows: seen.setdefault(nu(r["url"]), r)
uniq = list(seen.values())
split = lambda t: [x.strip() for x in re.split(r"[.。·・…|｜!！]+|\s{2,}|\.\.\.", t) if x.strip()]
texts = defaultdict(list)
for lf in ["log_pref.json", "log_queue.json", "log_pilot3.json"] + sorted(glob.glob("nat/log_*.json")):
    for e in json.load(open(lf)):
        for r in e.get("results", []):
            m = SHOP_RE.match(r["url"])
            if m: texts["/".join(m.groups()[:4])].append(r)
shopwide = {}
for k, lst in texts.items():
    cnt = defaultdict(set)
    for r in lst:
        for f in split(n(r["snippet"])):
            if len(f) >= 6: cnt[f].add(nu(r["url"]))
    shopwide[k] = {f for f, us in cnt.items() if len(us) >= 2}
items, skipped = [], Counter()
for i, r in enumerate(uniq):
    m = SHOP_RE.match(r["url"])
    if nu(r["url"]) in prior: skipped["known_page"] += 1; continue
    if not m: skipped["not_store_page"] += 1; continue
    if m.group(1) != r["pref"]: skipped["other_pref"] += 1; continue
    key = "/".join(m.groups()[:4]); kind = page_kind(m.groups()[4])
    name, area = title_name_area(r["title"], kind)
    sid = key2store.get(key)
    rest = " ".join(x for x in split(n(r["snippet"])) if x not in shopwide.get(key, set()))
    items.append(dict(cid=f"{ROUND}-{i:04d}", pref=r["pref"], key=key, kind=kind, url=r["url"], title=n(r["title"]), snippet=n(r["snippet"]), textWithoutStoreWideHeaders=rest,
                      pattern=r["pattern"], storeId=sid, storeName=(stores[sid]["name"] if sid in stores else None), titleStoreName=name, titleArea=area,
                      storeUrl=f"https://www.cityheaven.net/{key}/"))
json.dump(items, open(f"nat/items_{ROUND}.json", "w"), ensure_ascii=False, indent=1)
for f in glob.glob(f"nat/review_{ROUND}_*.json"): os.remove(f)
for j in range(0, len(items), CHUNK):
    json.dump(items[j:j + CHUNK], open(f"nat/review_{ROUND}_{j // CHUNK}.json", "w"), ensure_ascii=False, indent=1)
json.dump(dict(results=len(rows), unique=len(uniq), skipped=skipped, byPref=Counter(r["pref"] for r in uniq)), open(f"nat/cand_stats_{ROUND}.json", "w"), ensure_ascii=False)
print("results", len(rows), "unique", len(uniq), "skipped", dict(skipped), "items", len(items), Counter((it["pref"], "existing" if it["storeId"] else "new-key") for it in items), "chunks", (len(items) + CHUNK - 1) // CHUNK)
