"""公式特設ページ（ranking-deli.jp/missekichika/）のエリア×部門の一覧を全件取得する。
使い方: python3 -I official_list.py OUT.json CACHE_DIR [--year 2026]
- 風俗8部門: /missekichika/{area}/category{n}/   （n = 1,2,3,4,6,7,8,9）
- メンズエステ: /missekichika/menesth/{area}/
- ページ送り（page2/ や ?page=2）があれば最後までたどる
- ページの <title> に指定した年（既定 2026）がなければ「未公開」とし、出場者として扱わない
ログインが必要なページや、アクセス制限を回避する取得はしない。
"""
import json, os, re, sys, html, time, hashlib, subprocess

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
AREAS = {"hokkaido_tohoku": "北海道・東北", "kanto": "関東", "chubu": "中部",
         "kansai": "関西", "chugoku_shikoku": "中国・四国", "kyushu_okinawa": "九州・沖縄"}
CATS = {1: "デリヘル", 2: "ヘルス/ソープ", 3: "人妻/熟女", 4: "お姉さん", 6: "ロリ",
        7: "おっぱい", 8: "風俗エステ", 9: "ギャル/キレカワ"}
BASE = "https://ranking-deli.jp/missekichika/"


def get(url, cache, delay):
    p = os.path.join(cache, hashlib.sha1(url.encode()).hexdigest() + ".html")
    if os.path.exists(p):
        code, body = open(p, encoding="utf-8").read().split("\n", 1)
        return int(code), body
    r = subprocess.run(["curl", "-sS", "-L", "--compressed", "--max-time", "40", "-A", UA,
                        "-w", "\n__HTTP__%{http_code}", url],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    body, _, code = r.stdout.rpartition("\n__HTTP__")
    code = int(code or 0)
    os.makedirs(cache, exist_ok=True)
    open(p, "w", encoding="utf-8").write(f"{code}\n{body}")
    time.sleep(delay)
    return code, body


def txt(s):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s))).strip()


def parse_items(body):
    """<li class="listItem"> ごとに 女の子ページURL・ID・源氏名・店名・都道府県 を取り出す。"""
    items = []
    for m in re.finditer(r'<a href="(https://ranking-deli\.jp/[a-z_]+/area\d+/style\d+/\d+/\d+/)"[^>]*?'
                         r'data-gtm-misseki="([^"]*)"[^>]*?data-girl-id="(\d+)"', body, re.S):
        seg = body[m.end():m.end() + 3000]
        name = re.search(r'<p class="girlsName">\s*<span[^>]*>(.*?)</span>', seg, re.S)
        shop = re.search(r'<p class="shop_name">\s*<span[^>]*>(.*?)</span>', seg, re.S)
        gtm = html.unescape(m.group(2)).split("_")
        items.append(dict(girl_url=m.group(1), girl_id=m.group(3),
                          name=txt(name.group(1)) if name else (gtm[0] if gtm else None),
                          shop=txt(shop.group(1)) if shop else None,
                          pref=gtm[-3] if len(gtm) >= 4 else None,
                          station=gtm[-2] if len(gtm) >= 4 else None,
                          genre_label=gtm[-1] if gtm else None))
    return items


def next_pages(url, body):
    base = url.split("?")[0]
    pages = set()
    for h in re.findall(r'href="([^"]+)"', body):
        h = html.unescape(h)
        if h.startswith(base) and re.search(r"(page\d+/?|[?&]page=\d+|[?&]p=\d+)$", h):
            pages.add(h)
    return sorted(pages, key=lambda u: int(re.findall(r"\d+", u)[-1]))


def crawl(cache, year="2026", delay=1.5):
    targets = [(a, CATS[n], f"{BASE}{a}/category{n}/") for a in AREAS for n in CATS]
    targets += [(a, "メンズエステ", f"{BASE}menesth/{a}/") for a in AREAS]
    pages, rows = [], []
    for area, cat, url in targets:
        seen, queue = set(), [url]
        while queue:
            u = queue.pop(0)
            if u in seen: continue
            seen.add(u)
            code, body = get(u, cache, delay)
            title = re.search(r"<title>(.*?)</title>", body, re.S)
            title = txt(title.group(1)) if title else ""
            stage = re.search(r'class="girls_section[^"]*?(preliminary_result|preliminary|final_result|final|election)?[^"]*"', body)
            items = parse_items(body) if code == 200 else []
            ok = code == 200 and year in title
            pages.append(dict(area=AREAS[area], category=cat, url=u, status=code, title=title,
                              year_ok=ok, items=len(items), section=stage.group(0) if stage else None))
            if ok:
                for it in items:
                    it.update(area=AREAS[area], category=cat, list_url=u, list_title=title)
                    rows.append(it)
                queue += [p for p in next_pages(u, body) if p not in seen]
    return pages, rows


if __name__ == "__main__":
    out, cache = sys.argv[1], sys.argv[2]
    year = sys.argv[sys.argv.index("--year") + 1] if "--year" in sys.argv else "2026"
    pages, rows = crawl(cache, year, float(os.environ.get("DELAY", "1.5")))
    people = {r["girl_id"] for r in rows}
    json.dump(dict(year=year, pages=pages, rows=rows), open(out, "w"), ensure_ascii=False, indent=1)
    pub = sum(p["year_ok"] for p in pages)
    print(f"{year}: 一覧ページ {pub}/{len(pages)} 公開, 行 {len(rows)}, 重複を除いた人数 {len(people)}")
