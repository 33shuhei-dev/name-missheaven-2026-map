"""Yahoo!リアルタイム検索（Xの公開投稿の検索）の結果を、sns_items.py が読める形（title/snippet/url）で sns/log_{ROUND}.json に保存する。
使い方: python3 rt_search.py ROUND METHOD::QUERY::MAXPAGES ..."""
import json, sys, os, re, hashlib, subprocess, time, urllib.parse, html
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
os.makedirs("cache", exist_ok=True)
def fetch(q, b):
    url = "https://search.yahoo.co.jp/realtime/search?p=" + urllib.parse.quote(q) + "&ei=UTF-8" + (f"&start={b}" if b > 1 else "")
    path = "cache/rt_" + hashlib.sha1(url.encode()).hexdigest() + ".json"
    if os.path.exists(path): return json.load(open(path)), True
    for attempt in range(3):
        p = subprocess.run(["curl", "-sS", "--compressed", "--max-time", "25", "-A", UA, "-H", "Accept-Language: ja-JP,ja;q=0.9", "-w", "\n__HTTP__%{http_code}", url], capture_output=True, text=True, encoding="utf-8", errors="replace")
        body, _, code = p.stdout.rpartition("\n__HTTP__")
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', body, re.S)
        if code == "200" and m:
            d = json.loads(m.group(1))["props"]["pageProps"]["pageData"]
            res = d["timeline"]["entry"] if d.get("timeline") else []
            data = dict(total=d["timeline"]["head"]["totalResultsAvailable"] if d.get("timeline") else 0, entries=[dict(url=e["url"].split("?")[0], name=e.get("name"), screen=e.get("screenName"), text=re.sub(r"\tSTART\t|\tEND\t", "", e.get("displayTextBody") or e.get("displayText") or ""), at=e.get("createdAt"), urls=[(x.get("expandedUrl") or x.get("url")) if isinstance(x,dict) else str(x) for x in (e.get("urls") or [])]) for e in res])
            json.dump(data, open(path, "w"), ensure_ascii=False)
            time.sleep(float(os.environ.get("YS_DELAY", "6"))); return data, False
        time.sleep(10 * (attempt + 1))
    raise RuntimeError("fetch failed")
ROUND, specs = sys.argv[1], sys.argv[2:]
f = f"sns/log_{ROUND}.json"; out = json.load(open(f)) if os.path.exists(f) else []
for spec in specs:
    m, q, maxp = spec.split("::")
    b = 1
    for pg in range(1, int(maxp) + 1):
        data, cached = fetch(q, b)
        results = [dict(url=e["url"], title=f'{e["name"]} (@{e["screen"]})', snippet=e["text"], urls=e.get("urls", [])) for e in data["entries"]]
        out.append(dict(query=q, page=pg, method=m, results=results, total=data["total"])); json.dump(out, open(f, "w"), ensure_ascii=False, indent=1)
        print(m, pg, "returned", len(results), "total", data["total"], flush=True)
        if len(results) < 5 or b + 40 > data["total"] + 40: break
        b += 40
