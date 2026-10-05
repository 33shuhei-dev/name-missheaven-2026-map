"""優先度付きの検索キュー。キャッシュ済みは再取得しない。結果は log_queue.json に追記保存。"""
import json, os, re, sys
sys.path.insert(0, ".")
from ysearch import web
from discover import PREFS

def build_queue():
    items = []
    pass1 = json.load(open("log_pref.json"))
    # 1) 第1パスで失敗したページ
    for e in pass1:
        if e.get("error"):
            items.append((1, e["tag"], e["query"], e["page"]))
    # 2) 店名が取れていない店舗：店舗パス限定検索
    shops = json.load(open("shops_pref.json"))["shops"]
    for s in shops:
        if not s["name"]:
            items.append((2, "shop:" + s["key"], f"site:www.cityheaven.net/{s['key']}/ ミスヘブン 2026", 1))
    # 3) 上限に達した県の主検索を 6〜10 ページ目まで
    for slug, name in PREFS:
        q = f'site:www.cityheaven.net/{slug}/ "ミスヘブン総選挙2026"'
        last = [e for e in pass1 if e["query"] == q and e["page"] == 5 and len(e.get("results", [])) == 10]
        if last:
            for p in range(6, 11):
                items.append((3, f"pref:{slug}", q, p))
    # 4) 掲載エリアコード単位（上限に達した県のみ）
    capped = {i[1] for i in items if i[0] == 3}
    codes = set()
    for e in pass1:
        for r in e.get("results", []):
            m = re.match(r"^https?://(?:www|smart)\.cityheaven\.net/([a-z]+)/(A\d{4})/", r["url"])
            if m and f"pref:{m.group(1)}" in capped:
                codes.add(m.groups())
    # （掲載エリアコード単位の検索は、検索エンジンの混雑制限のため今回は実行しない）
    items.sort(key=lambda x: x[0])
    return items

if __name__ == "__main__":
    items = build_queue()
    print("queue", len(items), {k: sum(1 for i in items if i[0] == k) for k in (1, 2, 3, 4)}, flush=True)
    log = json.load(open("log_queue.json")) if os.path.exists("log_queue.json") else []
    done = {(e["query"], e["page"]) for e in log if not e.get("error")}
    stop_after_empty = set()
    for n, (prio, tag, q, page) in enumerate(items):
        if (q, page) in done or (q in stop_after_empty and page > 1):
            continue
        try:
            r = web(q, page)
            r["tag"] = tag
            r["priority"] = prio
            if len(r["results"]) < 10:
                stop_after_empty.add(q)
        except Exception as e:
            r = {"tag": tag, "query": q, "page": page, "error": str(e), "results": [], "priority": prio}
        log.append(r)
        if n % 5 == 0:
            json.dump(log, open("log_queue.json", "w"), ensure_ascii=False)
            print(n, prio, tag, page, len(r["results"]), r.get("error", ""), flush=True)
    json.dump(log, open("log_queue.json", "w"), ensure_ascii=False)
    print("done", flush=True)
