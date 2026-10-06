"""仕上げPhase 優先1：店名を確認できなかった店舗キーを、そのキーの配下ページのタイトルで確認する（key単位の検索1回）。"""
import json, sys, re, unicodedata
sys.path.insert(0, ".")
from ysearch import web
u = json.load(open("nat/unresolved.json"))
keys = [k for k, v in u.items() if v["status"] == "no_store_name"]
out = []
for k in keys:
    q = f"site:www.cityheaven.net/{k}/"
    try: r = web(q, 1)
    except Exception as e: r = {"query": q, "page": 1, "results": [], "error": str(e)}
    r.update(pref=k.split("/")[0], pattern="key", key=k)
    out.append(r); json.dump(out, open("nat/log_f3.json", "w"), ensure_ascii=False, indent=1)
    print(k, len(r["results"]), r.get("error", ""), flush=True)
print("done f3", len(out))
