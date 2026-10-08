"""本人発信起点：検索結果（x.com）を、レビュー用の項目にする。既に処理した結果URLは除外する。使い方: python3 sns_items.py ROUND CHUNK"""
import json, re, sys, glob, os, unicodedata
from urllib.parse import urlsplit
ROUND, CHUNK = sys.argv[1], int(sys.argv[2])
n = lambda s: unicodedata.normalize("NFKC", s or "")
norm = lambda u: re.sub(r"/+$", "", urlsplit(u)._replace(query="", fragment="").geturl().replace("twitter.com", "x.com"))
prior = set()
for f in glob.glob("sns/log_*.json"):
    if f.endswith(f"log_{ROUND}.json"): continue
    for e in json.load(open(f)):
        for r in e["results"]: prior.add(norm(r["url"]))
seen, items = set(), []
for e in json.load(open(f"sns/log_{ROUND}.json")):
    for r in e["results"]:
        u = norm(r["url"])
        if u in seen or u in prior: continue
        seen.add(u)
        m = re.match(r"https://x\.com/([A-Za-z0-9_]+)", u)
        items.append(dict(cid=f"{ROUND}-{len(items):04d}", method=e["method"], url=u, handle=m.group(1) if m else None, title=n(r["title"]), snippet=n(r["snippet"])))
json.dump(items, open(f"sns/items_{ROUND}.json", "w"), ensure_ascii=False, indent=1)
for f in glob.glob(f"sns/review_{ROUND}_*.json"): os.remove(f)
for j in range(0, len(items), CHUNK): json.dump(items[j:j + CHUNK], open(f"sns/review_{ROUND}_{j // CHUNK}.json", "w"), ensure_ascii=False, indent=1)
print("items", len(items), "skipped_known", len(prior), "chunks", (len(items) + CHUNK - 1) // CHUNK)
