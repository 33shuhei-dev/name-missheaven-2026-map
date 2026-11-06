"""Yahoo!リアルタイム検索（Xの公開投稿。robots.txt で /realtime/ は許可）で、ミス駅ちか総選挙の投稿を集める。
使い方: python3 -I x_realtime.py OUT.json QUERY... （間隔は YS_DELAY 秒、既定6）"""
import json, os, re, sys, subprocess, time, urllib.parse
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
OUT, QS = sys.argv[1], sys.argv[2:]
res = json.load(open(OUT)) if os.path.exists(OUT) else {}
for q in QS:
    b = 1
    while True:
        url = "https://search.yahoo.co.jp/realtime/search?p=" + urllib.parse.quote(q) + "&ei=UTF-8" + (f"&start={b}" if b > 1 else "")
        body = subprocess.run(["curl", "-sS", "--compressed", "--max-time", "25", "-A", UA, "-H", "Accept-Language: ja-JP,ja;q=0.9", url],
                              capture_output=True, text=True, encoding="utf-8", errors="replace").stdout
        time.sleep(float(os.environ.get("YS_DELAY", "6")))
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', body, re.S)
        if not m: print(q, b, "取得失敗"); break
        d = json.loads(m.group(1))["props"]["pageProps"]["pageData"]
        tl = d.get("timeline") or {}
        es = tl.get("entry") or []
        new = 0
        for e in es:
            u = e["url"].split("?")[0]
            if u not in res: new += 1
            r = res.setdefault(u, dict(url=u, name=e.get("name"), screen=e.get("screenName"), at=e.get("createdAt"),
                                       text=re.sub(r"\tSTART\t|\tEND\t", "", e.get("displayTextBody") or e.get("displayText") or ""),
                                       urls=[(x.get("expandedUrl") or x.get("url")) if isinstance(x, dict) else str(x) for x in (e.get("urls") or [])],
                                       queries=[]))
            if q not in r["queries"]: r["queries"].append(q)
        total = (tl.get("head") or {}).get("totalResultsAvailable", 0)
        print(q, "b", b, "取得", len(es), "新規", new, "総数", total, flush=True)
        json.dump(res, open(OUT, "w"), ensure_ascii=False, indent=1)
        if len(es) < 10 or b + len(es) > total or b > 400: break
        b += len(es)
print("投稿数", len(res))
