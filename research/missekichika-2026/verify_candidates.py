"""候補CSV（grokメモの33人／要確認11人）の根拠を、駅ちか・メンエスmallの公開ページで確認し直す。
使い方: python3 -I verify_candidates.py IN.csv OUT.json CACHE_DIR
- プロフィールURL: HTTP状態・ページ上の源氏名・店名
- 根拠の日記: 写メ日記一覧（page1〜）から日記IDの投稿を探し、タイトル・本文・投稿日時・投稿者を取り出す
ログインが必要なページや、アクセス制限を回避する取得はしない。
"""
import csv, json, os, re, sys, html, time, hashlib, subprocess
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
IN, OUT, CACHE = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(CACHE, exist_ok=True)
DELAY = float(os.environ.get("DELAY", "1.5"))

def get(url):
    p = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest() + ".html")
    if os.path.exists(p):
        code, body = open(p, encoding="utf-8").read().split("\n", 1); return int(code), body
    r = subprocess.run(["curl", "-sS", "-L", "--compressed", "--max-time", "30", "-A", UA, "-w", "\n__HTTP__%{http_code}", url],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    body, _, code = r.stdout.rpartition("\n__HTTP__")
    code = int(code or 0)
    open(p, "w", encoding="utf-8").write(f"{code}\n{body}")
    time.sleep(DELAY)
    return code, body

def text(s):
    s = re.sub(r"<br\s*/?>", "\n", s)
    return html.unescape(re.sub(r"[ \t\r\f\v]+", " ", re.sub(r"<[^>]+>", " ", s))).strip()

def profile(url):
    if not url: return dict(status=None)
    code, b = get(url)
    if code != 200: return dict(status=code)
    name = re.search(r'data-keep-name="([^"]*)"', b)
    t = re.search(r"<title>(.*?)</title>", b, re.S)
    return dict(status=code, name=html.unescape(name.group(1)) if name else None,
                title=html.unescape(t.group(1).strip())[:160] if t else None)

def diary_blocks(b):
    """1件の日記 = class="detailHead"（投稿者・投稿日時）から次の detailHead まで。"""
    pos = [m.start() for m in re.finditer(r'class="detailHead"', b)]
    for k, p in enumerate(pos):
        seg = b[p:pos[k + 1] if k + 1 < len(pos) else len(b)]
        m = re.search(r'data-maildiary-likeid="(\d+)"', seg)
        if m: yield m.group(1), seg

def parse_block(seg):
    ttl = re.search(r'<p class="ttl[^"]*">(.*?)</p>', seg, re.S)
    body = re.search(r'<span class="body ql-editor removal-new-line-body">(.*?)</span>\s*<span class="body ql-editor cleaned-body"', seg, re.S) \
        or re.search(r'<span class="body[^"]*">(.*?)</span>', seg, re.S)
    name = re.search(r'<em class="name[^"]*">(.*?)</em>', seg, re.S)
    date = re.search(r'<span class="postDate">(.*?)</span>', seg)
    girl = re.search(r'<a class="nameWrap" href="([^"]+)"', seg)
    return dict(title=text(ttl.group(1)) if ttl else None, body=text(body.group(1)) if body else None,
                poster=text(name.group(1)).lstrip("@") if name else None, posted=date.group(1) if date else None,
                poster_url=girl.group(1) if girl else None)

def find_diary(url, did, maxpages=15):
    base = url.split("#")[0]
    for pg in range(1, maxpages + 1):
        u = base if pg == 1 else base + f"page{pg}/"
        code, b = get(u)
        if code != 200: return dict(found=False, list_status=code, page=pg, list_url=u)
        for i, seg in diary_blocks(b):
            if i == did:
                d = parse_block(seg); d.update(found=True, page=pg, list_url=u); return d
        if 'data-maildiary-likeid' not in b: return dict(found=False, page=pg, list_url=u, note="一覧に日記なし")
        if f"page{pg+1}/" not in b: return dict(found=False, page=pg, list_url=u, note="最終ページまで見つからず")
    return dict(found=False, page=maxpages, note="上限ページまで見つからず")

def menesmall(url):
    code, b = get(url)
    if code != 200: return dict(found=False, list_status=code)
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", b, flags=re.S)
    tt = text(t)
    i = min([j for j in (tt.find("駅ちか"), tt.find("駅チカ"), tt.find("ミス駅")) if j >= 0] or [0])
    return dict(found=True, body=tt[max(0, i - 600):i + 900], list_url=url)

rows = list(csv.DictReader(open(IN, encoding="utf-8")))
out = []
for r in rows:
    ev = r.get("出場根拠の投稿URL") or r.get("投稿URL")
    rec = dict(row=r, profile=profile(r.get("駅ちかプロフィールURL")))
    if "menesmall.jp" in ev: rec["diary"] = menesmall(ev)
    else:
        did = ev.split("#")[-1] if "#" in ev else None
        rec["diary"] = find_diary(ev, did) if did else dict(found=False, note="日記IDなし")
    out.append(rec)
    print(r["都道府県"], r["公開名"], rec["profile"].get("status"), rec["profile"].get("name"), "| diary", rec["diary"].get("found"), rec["diary"].get("page"), rec["diary"].get("posted"), rec["diary"].get("poster"), flush=True)
json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
