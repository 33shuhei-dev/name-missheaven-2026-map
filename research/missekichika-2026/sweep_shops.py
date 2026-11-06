"""駅ちかの店舗の写メ日記一覧・ニュースから、ミス駅ちか総選挙に触れた公開投稿を集める。
使い方: python3 -I sweep_shops.py SHOPS.json OUTDIR [--since 10/21] [--maxpages 15]
- SHOPS.json: 店舗トップURLの配列（例: https://ranking-deli.jp/osaka/area121/style8/50284/）
- 店舗の /maildiary/ を page1 から順に読み、投稿日時が --since より古くなったら止める
- /news/ は1ページ目だけ読む
- キーワードに当たった投稿だけを OUTDIR/hits.jsonl に保存する（ページ本体は保存しない）
- 途中で止めても、OUTDIR/done.txt にある店舗は飛ばして再開できる
robots.txt で禁止されている /preflist/ /girl-list/ /shop-list/ は使わない。ログインが必要なページは読まない。
"""
import json, os, re, sys, html, time, subprocess

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
KW = re.compile(r"ミス\s*駅|駅[ちチ][かカ]\S{0,8}総選挙|駅[ちチ][かカ]\s*総選挙|駅♡か|MISS\s*EKICHIKA|ミス駅", re.I)
SHOPS, OUT = sys.argv[1], sys.argv[2]
arg = lambda k, d: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
SINCE = tuple(int(x) for x in arg("--since", "10/21").split("/"))
MAXP = int(arg("--maxpages", "15"))
DELAY = float(os.environ.get("DELAY", "1.0"))
os.makedirs(OUT, exist_ok=True)


def get(url):
    for attempt in range(3):
        r = subprocess.run(["curl", "-sS", "-L", "--compressed", "--max-time", "40", "-A", UA,
                            "-w", "\n__HTTP__%{http_code}", url],
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
        body, _, code = r.stdout.rpartition("\n__HTTP__")
        time.sleep(DELAY)
        if code and code != "000" and not code.startswith("5"): return int(code), body
        time.sleep(5 * (attempt + 1))
    return 0, ""


def text(s):
    s = re.sub(r"<br\s*/?>|</p>", "\n", s)
    return html.unescape(re.sub(r"[ \t\r\f\v]+", " ", re.sub(r"<[^>]+>", " ", s))).strip()


def entries(b):
    pos = [m.start() for m in re.finditer(r'class="detailHead"', b)]
    for k, p in enumerate(pos):
        seg = b[p:pos[k + 1] if k + 1 < len(pos) else len(b)]
        did = re.search(r'data-maildiary-likeid="(\d+)"', seg)
        if not did: continue
        ttl = re.search(r'<p class="ttl[^"]*">(.*?)</p>', seg, re.S)
        body = re.search(r'<span class="body ql-editor removal-new-line-body">(.*?)</span>\s*<span class="body ql-editor cleaned-body"', seg, re.S) \
            or re.search(r'<span class="body[^"]*">(.*?)</span>', seg, re.S)
        name = re.search(r'<em class="name[^"]*">(.*?)</em>', seg, re.S)
        date = re.search(r'<span class="postDate">(.*?)</span>', seg)
        girl = re.search(r'<a class="nameWrap" href="([^"]+)"', seg)
        yield dict(diary_id=did.group(1), title=text(ttl.group(1)) if ttl else "", body=text(body.group(1)) if body else "",
                   poster=text(name.group(1)).lstrip("@") if name else "", posted=date.group(1) if date else "",
                   poster_url=girl.group(1) if girl else "")


def md(s):
    m = re.match(r"(\d{1,2})/(\d{1,2})", s or "")
    return (int(m.group(1)), int(m.group(2))) if m else None


shops = json.load(open(SHOPS))
done = set(open(os.path.join(OUT, "done.txt")).read().split()) if os.path.exists(os.path.join(OUT, "done.txt")) else set()
hits = open(os.path.join(OUT, "hits.jsonl"), "a", encoding="utf-8")
log = open(os.path.join(OUT, "log.jsonl"), "a", encoding="utf-8")
donef = open(os.path.join(OUT, "done.txt"), "a")
for n, shop in enumerate(shops, 1):
    if shop in done: continue
    stat = dict(shop=shop, pages=0, entries=0, hits=0, status=None, oldest=None)
    code, b = get(shop)
    stat["status"] = code
    sname = re.search(r'data-keep-name="([^"]*)"', b) or re.search(r"<title>(.*?)</title>", b, re.S)
    stat["shop_name"] = html.unescape(sname.group(1)).strip()[:80] if sname else ""
    if code == 200:
        for pg in range(1, MAXP + 1):
            u = shop + "maildiary/" + ("" if pg == 1 else f"page{pg}/")
            c, b = get(u)
            if c != 200: break
            es = list(entries(b))
            stat["pages"] += 1; stat["entries"] += len(es)
            for e in es:
                if KW.search(e["title"] + "\n" + e["body"]):
                    e.update(shop=shop, shop_name=stat["shop_name"], list_url=u, kind="diary")
                    hits.write(json.dumps(e, ensure_ascii=False) + "\n"); stat["hits"] += 1
            ds = [md(e["posted"]) for e in es if md(e["posted"])]
            if ds: stat["oldest"] = "%d/%d" % min(ds)
            if not es or (ds and min(ds) < SINCE and min(ds)[0] >= 9) or f"maildiary/page{pg+1}/" not in b: break
        c, b = get(shop + "news/")
        if c == 200:
            t = text(re.sub(r"<script.*?</script>|<style.*?</style>", "", b, flags=re.S))
            for m in KW.finditer(t):
                hits.write(json.dumps(dict(kind="news", shop=shop, shop_name=stat["shop_name"], list_url=shop + "news/",
                                           excerpt=t[max(0, m.start() - 300):m.start() + 500]), ensure_ascii=False) + "\n")
                stat["hits"] += 1; break
    hits.flush(); log.write(json.dumps(stat, ensure_ascii=False) + "\n"); log.flush()
    donef.write(shop + "\n"); donef.flush()
    print(n, len(shops), stat["shop_name"][:30], stat["pages"], stat["hits"], stat["oldest"], flush=True)
