"""全ログを統合：query_plan.json（県別の実行状況）と、全結果を使った店舗抽出（shops_final.json）。"""
import json, os, subprocess
logs = [f for f in ("log_pref.json", "log_queue.json") if os.path.exists(f)]
entries = [e for f in logs for e in json.load(open(f))]
ok = {(e["query"], e["page"]) for e in entries if not e.get("error")}
plan = []
seen = set()
for e in entries:
    k = (e["tag"], e["query"], e["page"])
    if k in seen:
        continue
    seen.add(k)
    retried_ok = (e["query"], e["page"]) in ok
    plan.append({"tag": e["tag"], "query": e["query"], "page": e["page"], "resultCount": len(e.get("results", [])) if not e.get("error") else 0,
                 "error": None if retried_ok else e.get("error"), "searchUrl": e.get("url")})
# 成功した記録があるものは失敗記録を除く
plan = [p for p in plan if not (p["error"] is None and (p["query"], p["page"]) not in ok)]
json.dump(plan, open("query_plan.json", "w"), ensure_ascii=False)
subprocess.run(["python3", "analyze.py", *logs, "categories.json", "shops_final.json"], check=True)
fails = [p for p in plan if p["error"]]
print("plan", len(plan), "unresolved errors", len(fails), sorted({p["tag"] for p in fails}))
