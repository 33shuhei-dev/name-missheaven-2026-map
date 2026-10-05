"""Yahoo! JAPAN 検索の結果（タイトル・URL・抜粋）を取得してキャッシュする調査用ツール。"""
import hashlib, html, json, os, re, sys, time, urllib.parse, urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(BASE, "cache")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

def _get(url):
    key = hashlib.sha1(url.encode()).hexdigest()
    path = os.path.join(CACHE, key + ".html")
    if os.path.exists(path):
        return open(path, encoding="utf-8").read(), True
    import subprocess
    err = None
    for attempt in range(3):
        p = subprocess.run(
            ["curl", "-sS", "--compressed", "--max-time", "25", "-w", "\n__HTTP__%{http_code}",
             "-A", UA, "-H", "Accept-Language: ja-JP,ja;q=0.9,en;q=0.5",
             "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", url],
            capture_output=True, text=True, encoding="utf-8", errors="replace")
        body, _, code = p.stdout.rpartition("\n__HTTP__")
        if code == "200" and "__NEXT_DATA__" in body:
            open(path, "w", encoding="utf-8").write(body)
            time.sleep(float(os.environ.get("YS_DELAY", "6")))
            return body, False
        err = RuntimeError(f"HTTP {code or 'ERR'} {p.stderr[:80]}")
        time.sleep(120 if code == "429" else 10 * (attempt + 1))
    raise err

def clean(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()

def web(query, page=1):
    b = "" if page == 1 else f"&b={(page - 1) * 10 + 1}"
    url = "https://search.yahoo.co.jp/search?ei=UTF-8&p=" + urllib.parse.quote(query) + b
    body, cached = _get(url)
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', body, re.S)
    if not m:
        return {"query": query, "page": page, "url": url, "results": [], "error": "no_next_data"}
    d = json.loads(m.group(1))
    algos = d["props"]["pageProps"]["initialProps"]["pageData"].get("algos") or []
    res = [{"url": a["url"], "title": clean(a.get("title")), "snippet": clean(a.get("description"))} for a in algos if a.get("url")]
    return {"query": query, "page": page, "url": url, "results": res}

def realtime(query):
    url = "https://search.yahoo.co.jp/realtime/search?ei=UTF-8&p=" + urllib.parse.quote(query)
    body, cached = _get(url)
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', body, re.S)
    if not m:
        return {"query": query, "url": url, "results": [], "error": "no_next_data"}
    d = json.loads(m.group(1))
    pp = d["props"]["pageProps"]
    out = []
    def walk(o):
        if isinstance(o, dict):
            if "displayText" in o and ("screenName" in o or "name" in o):
                out.append({k: o.get(k) for k in ("name", "screenName", "displayText", "createdAt", "url", "id")})
            for v in o.values(): walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    walk(pp)
    return {"query": query, "url": url, "results": out}

if __name__ == "__main__":
    mode, q = sys.argv[1], sys.argv[2]
    r = web(q) if mode == "web" else realtime(q)
    print(json.dumps(r, ensure_ascii=False, indent=1)[:6000])
