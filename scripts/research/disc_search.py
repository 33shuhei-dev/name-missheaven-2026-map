"""探索仮説の検証：ヘブン限定の検索結果を nat/log_{ROUND}.json に保存する（nat_candidates.py がそのまま使える形）。
使い方: python3 disc_search.py ROUND METHOD::QUERY::PAGES::PREFSLUG ..."""
import json, sys, os
sys.path.insert(0, ".")
from ysearch import web
ROUND, specs = sys.argv[1], sys.argv[2:]
f = f"nat/log_{ROUND}.json"
out = json.load(open(f)) if os.path.exists(f) else []
for spec in specs:
    m, q, pages, pref = spec.split("::")
    for pg in range(1, int(pages) + 1):
        try: r = web(q, pg)
        except Exception as e: r = {"query": q, "page": pg, "results": [], "error": str(e)}
        r.update(pref=pref, pattern=m); out.append(r)
        json.dump(out, open(f, "w"), ensure_ascii=False, indent=1)
        print(m, pref, pg, len(r["results"]), r.get("error", ""), flush=True)
        if len(r["results"]) < 10: break
