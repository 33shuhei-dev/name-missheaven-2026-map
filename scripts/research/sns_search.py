"""本人発信起点の出場者発見パイロット：検索式を比較する。使い方: python3 sns_search.py ROUND METHOD:QUERY:PAGES ..."""
import json, sys, os, glob, re
from urllib.parse import urlsplit
sys.path.insert(0, ".")
from ysearch import web
ROUND, specs = sys.argv[1], sys.argv[2:]
out = json.load(open(f"sns/log_{ROUND}.json")) if os.path.exists(f"sns/log_{ROUND}.json") else []
for spec in specs:
    m, q, pages = spec.split("::")
    for pg in range(1, int(pages) + 1):
        try: r = web(q, pg)
        except Exception as e: r = {"query": q, "page": pg, "results": [], "error": str(e)}
        r.update(method=m, round=ROUND); out.append(r)
        json.dump(out, open(f"sns/log_{ROUND}.json", "w"), ensure_ascii=False, indent=1)
        dom = {}
        for x in r["results"]:
            h = urlsplit(x["url"]).netloc.replace("www.", ""); dom[h] = dom.get(h, 0) + 1
        print(m, pg, len(r["results"]), dict(sorted(dom.items(), key=lambda kv: -kv[1])[:5]), r.get("error", ""), flush=True)
        if len(r["results"]) < 10: break
