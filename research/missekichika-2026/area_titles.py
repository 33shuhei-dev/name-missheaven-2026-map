"""47都道府県と各エリアの写メ日記一覧（/{pref}/maildiary/ と /{pref}/maildiary/area{n}/。1ページ目だけ）から、
タイトルにミス駅ちか総選挙の語がある日記を拾う。/preflist/（robots.txt で禁止）は使わない。
使い方: python3 -I area_titles.py OUT.json"""
import json, os, re, sys, html, time, subprocess
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
KW = re.compile(r"ミス\s*駅|駅[ちチ][かカ]\S{0,8}総選挙|駅[ちチ][かカ]\s*総選挙|駅♡か|MISS\s*EKICHIKA|総選挙", re.I)
PREFS = ("hokkaido aomori iwate miyagi akita yamagata fukushima ibaraki tochigi gunma saitama chiba tokyo kanagawa "
         "niigata toyama ishikawa fukui yamanashi nagano gifu shizuoka aichi mie shiga kyoto osaka hyogo nara wakayama "
         "tottori shimane okayama hiroshima yamaguchi tokushima kagawa ehime kochi fukuoka saga nagasaki kumamoto oita "
         "miyazaki kagoshima okinawa").split()
def get(u):
    r = subprocess.run(["curl", "-sS", "-L", "--compressed", "--max-time", "40", "-A", UA, "-w", "\n__HTTP__%{http_code}", u],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    b, _, c = r.stdout.rpartition("\n__HTTP__"); time.sleep(float(os.environ.get("DELAY", "1.0"))); return int(c or 0), b
def items(b):
    for m in re.finditer(r'<a href="(https://ranking-deli\.jp/[a-z]+/area\d+/style\d+/(\d+)/(\d+)/maildiary/#(\d+))"(.*?)</a>', b, re.S):
        seg = m.group(5)
        t = re.search(r'<p class="bottom_text">(.*?)</p>', seg, re.S)
        sn = re.search(r"'shop_name':'([^']*)'", seg); gn = re.search(r"'girl_name':'([^']*)'", seg)
        yield dict(url=m.group(1), shop_id=m.group(2), girl_id=m.group(3), diary_id=m.group(4),
                   title=html.unescape(re.sub(r"<[^>]+>", "", t.group(1))).strip() if t else "",
                   shop_name=html.unescape(sn.group(1)) if sn else "", girl_name=html.unescape(gn.group(1)) if gn else "")
out = dict(pages=[], items={})
for p in PREFS:
    c, b = get(f"https://ranking-deli.jp/{p}/maildiary/")
    areas = sorted(set(re.findall(rf'href="(https://ranking-deli\.jp/{p}/maildiary/area\d+/)"', b)))
    pages = [(f"https://ranking-deli.jp/{p}/maildiary/", c, b)]
    for a in areas:
        ca, ba = get(a); pages.append((a, ca, ba))
    for u, c, b in pages:
        its = list(items(b)) if c == 200 else []
        out["pages"].append(dict(pref=p, url=u, status=c, items=len(its)))
        for it in its:
            it["pref"] = p; out["items"].setdefault(it["diary_id"], it)
    hit = sum(1 for i in out["items"].values() if i["pref"] == p and KW.search(i["title"]))
    print(p, "pages", len(pages), "diaries", sum(1 for i in out["items"].values() if i["pref"] == p), "title hits", hit, flush=True)
    json.dump(out, open(sys.argv[1], "w"), ensure_ascii=False)
