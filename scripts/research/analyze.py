"""検索結果から、ミスヘブン総選挙2026 の参加根拠がある CityHeaven 掲載店舗を抽出する。

判定ルール（推測しない）
- 店舗の特定: CityHeaven の店舗URL /{県}/{A4桁}/{A6桁}/{店舗スラッグ}/ のみ。県は URL の県スラッグから。
- 参加根拠: その店舗配下のページ（店舗トップ・イベント・在籍ページ等）の検索結果タイトル／抜粋に
  「ミスヘブン」と「2026」が近接して含まれ、かつ参加を示す語（エントリー・ノミネート・出場・部門・参加・投票・意気込み）があること。
- 店名・掲載地域: 店舗レベルのページ（トップ・イベント・クーポン等）の検索結果タイトルから。取れない場合は後段で店舗トップを検索。
- 部門: 抜粋中の「…部門」表記のうち、既知の部門原文（Phase 1）と完全一致するもの、または2件以上の異なるページに現れたもの。
- 人物名は保存しない。
"""
import json, re, sys, unicodedata
from collections import defaultdict

PREF_NAME = {"hokkaido":"北海道","aomori":"青森県","iwate":"岩手県","miyagi":"宮城県","akita":"秋田県","yamagata":"山形県","fukushima":"福島県","ibaraki":"茨城県","tochigi":"栃木県","gunma":"群馬県","saitama":"埼玉県","chiba":"千葉県","tokyo":"東京都","kanagawa":"神奈川県","niigata":"新潟県","toyama":"富山県","ishikawa":"石川県","fukui":"福井県","yamanashi":"山梨県","nagano":"長野県","gifu":"岐阜県","shizuoka":"静岡県","aichi":"愛知県","mie":"三重県","shiga":"滋賀県","kyoto":"京都府","osaka":"大阪府","hyogo":"兵庫県","nara":"奈良県","wakayama":"和歌山県","tottori":"鳥取県","shimane":"島根県","okayama":"岡山県","hiroshima":"広島県","yamaguchi":"山口県","tokushima":"徳島県","kagawa":"香川県","ehime":"愛媛県","kochi":"高知県","fukuoka":"福岡県","saga":"佐賀県","nagasaki":"長崎県","kumamoto":"熊本県","oita":"大分県","miyazaki":"宮崎県","kagoshima":"鹿児島県","okinawa":"沖縄県"}

SHOP_RE = re.compile(r"^https?://(?:www|smart)\.cityheaven\.net/([a-z]+)/(A\d{4})/(A\d{6})/([A-Za-z0-9_\-]+)/?(.*)$")
NOT_SHOP = {"reviewlist", "review", "girl-list", "shop-ranking", "shoplist", "girllist", "newface", "ranking", "typelist", "playlist", "coupon", "diarylist", "shop-list"}
MH2026 = re.compile(r"ミスヘブン.{0,10}2026|2026.{0,10}ミスヘブン")
PARTICIPATION = re.compile(r"エントリー|ノミネート|出場|部門|参加|意気込み|出馬|選出|ENTRY|NOMINEE|NOMINATION", re.I)
QUOTED_CAT = re.compile(r"[「『【｢\[〈《]([^」』】｣\]〉》\s]{1,20}部門)[」』】｣\]〉》]")
VERB_CAT = re.compile(r"(?:^|[\s、。,，☆★♪♡♥✨!！?？:：#＃|｜/／()（）<>＜＞〜~…・])([^\s、。,，「」『』【】\[\]☆★♪♡♥✨!！?？:：#＃|｜/／()（）<>＜＞〜~…]{1,16}部門)(?:に|で|へ|として)?\s*(?:出場|ノミネート|エントリー|参加|出ます|出させて)")
CAT_AFTER = re.compile(r"(?:部門は|[」』]の)\s*([^\s、。,，「」『』【】\[\]☆★♪♡♥✨!！?？:：#＃|｜/／()（）<>＜＞〜~…]{1,16}部門)")
CAT_RE = re.compile(r"([^\s、。,，「」『』【】\[\]☆★♪♡♥✨!！?？:：#＃|｜/／()（）<>＜＞〜~…・]" r"[^\s、。,，「」『』【】\[\]☆★♪♡♥✨!！?？:：#＃|｜/／()（）<>＜＞〜~…]{0,16}部門)")
BAD_CAT = re.compile(r"^(各|全|同|本|当|他|別|上位|部門)|ブロック|予選|本選|昨年|前回|2025")

def norm(s):
    return unicodedata.normalize("NFKC", s or "").replace(" ", "").replace("　", "")

def page_kind(rest):
    r = rest.lower()
    if r in ("", "?lo=1", "?spmode=pc") or r.startswith("?"):
        return "shop_top"
    if r.startswith("shopevent"):
        return "shop_event"
    if "girlid" in r or "a6girldetail" in r:
        return "cast"
    if "diary" in r:
        return "diary"
    return "shop_other"

def title_name_area(title, kind):
    """検索結果タイトルから店名と掲載地域を取り出す。人物名は取り出さない（捨てる）。"""
    t = title.strip()
    t = re.sub(r"[｜|]\s*シティヘブンネット.*$", "", t)
    t = re.sub(r"\s*-\s*シティヘブンネット$", "", t)
    if kind in ("cast", "diary"):
        m = re.match(r"^(?:写メ日記\s*-\s*)?「[^」]*」\s*(?:の写メ日記一覧[：:])?\s*(.+)$", t)
        if not m:
            return None, None
        t = m.group(1)
    else:
        t = re.sub(r"^(?:[^：:]{0,20}ページ目|[^：:\s]{1,12})[：:]\s*", "", t)
    t = re.sub(r"(の口コミ体験談|の口コミ|の動画)$", "", t)
    parts = [p.strip() for p in re.split(r"\s[-–―]\s", t) if p.strip()]
    if not parts:
        return None, None
    name = re.sub(r"^[^/／\s]{1,10}風俗[/／]\s*#?\s*", "", parts[0].lstrip("」』】)）・ ")).strip()
    if name.startswith("の") or re.search(r"ランキング|口コミ一覧|おすすめ風俗店|風俗店をご紹介|一覧$|してください|を選択|評判のお店|女の子一覧", name):
        return None, None
    if name in ("口コミ", "クーポン", "写メ日記", "イベント", "料金システム", "求人", "動画", "地図") or name.endswith("...") or name.endswith("…") or "シティヘブン" in name or len(name) > 50:
        return None, None
    area = None
    for p in parts[1:]:
        if "/" in p and not p.endswith("...") and not p.endswith("…"):
            area = p.split("/")[0].strip() or None
            break
    return name, area

def main(log_files, known_cats_file, out):
    known_cats = set(json.load(open(known_cats_file)))
    shops = defaultdict(lambda: {"evidence": [], "titles": [], "cats": defaultdict(set), "queries": set()})
    seen_urls = set()
    total = 0
    for lf in log_files:
        for entry in json.load(open(lf)):
            for r in entry.get("results", []):
                total += 1
                m = SHOP_RE.match(r["url"])
                if not m:
                    continue
                pref, a4, a6, slug, rest = m.groups()
                if pref not in PREF_NAME or slug.lower() in NOT_SHOP:
                    continue
                key = f"{pref}/{a4}/{a6}/{slug}"
                kind = page_kind(rest)
                s = shops[key]
                s["queries"].add(entry["query"])
                name, area = title_name_area(r["title"], kind)
                if name:
                    s["titles"].append({"name": name, "area": area, "url": r["url"], "kind": kind})
                text = norm(r["title"]) + " " + norm(r["snippet"])
                if MH2026.search(text) and PARTICIPATION.search(text):
                    canon = r["url"].split("#")[0]
                    if canon not in {e["url"] for e in s["evidence"]}:
                        s["evidence"].append({"url": canon, "kind": kind, "title": r["title"], "snippet": r["snippet"]})
                    snip = unicodedata.normalize("NFKC", r["snippet"])
                    found = set(QUOTED_CAT.findall(snip)) | set(VERB_CAT.findall(snip)) | set(CAT_AFTER.findall(snip))
                    for c in known_cats:
                        cn = unicodedata.normalize("NFKC", c)
                        # 前後が区切りのときだけ（「店長オススメ部門」から「店長オススメ」、「大好き♡おっぱい部門」から「おっぱい部門」を取らない）
                        if re.search(r"(?<![^\s、。,，「」『』【】\[\]☆★!！?？:：#＃|｜/／()（）<>＜＞〜~…])" + re.escape(cn) + r"(?![^\s、。,，「」『』【】\[\]☆★!！?？:：#＃|｜/／()（）<>＜＞〜~…])", snip):
                            found.add(c)
                    for c in found:
                        c = re.sub(r"^(全国)?(ミスヘブン(総選挙)?\s*2026|2026\s*ミスヘブン(総選挙)?|2026年?|今年[はも]|昨年[はも]?)", "", c.lstrip("・ "))
                        if len(c) >= 3 and not BAD_CAT.search(c) and not re.search(r"ノミネート|エントリー|ミスヘブン|総選挙", c):
                            s["cats"][c].add(canon)
    result = []
    for key, s in shops.items():
        if not s["evidence"]:
            continue
        pref, a4, a6, slug = key.split("/")
        # 店名：店舗レベルページのタイトルで最頻のもの
        names = defaultdict(int)
        areas = defaultdict(int)
        for t in s["titles"]:
            names[t["name"]] += 2 if t["kind"] == "shop_top" else 1
            if t["area"]:
                areas[t["area"]] += 1
        name = max(names, key=names.get) if names else None
        def _nn(x):
            x = unicodedata.normalize("NFKC", x).lower()
            x = re.sub(r"[（(][^）)]*[）)]", "", x)
            return re.sub(r"[\s・･\-－―ー_.,、。]", "", x)
        variants = sorted({n for n in names if name and n != name and _nn(n) == _nn(name)})
        area = max(areas, key=areas.get) if areas else None
        cats = {}
        for c, urls in s["cats"].items():
            cats[c] = sorted(urls)
        result.append({
            "key": key, "prefSlug": pref, "prefecture": PREF_NAME[pref], "slug": slug,
            "storeUrl": f"https://www.cityheaven.net/{pref}/{a4}/{a6}/{slug}/",
            "name": name, "nameVariants": variants, "nameCandidates": dict(names), "listingArea": area,
            "evidence": s["evidence"], "evidencePageCount": len(s["evidence"]),
            "categories": cats, "queries": sorted(s["queries"]),
        })
    # 既知の部門原文以外は、2店舗以上で現れたものだけ採用（人名の混入や抜粋の切れ端を避ける）
    from collections import Counter as _C
    store_freq = _C(c for x in result for c in x["categories"])
    for x in result:
        x["categories"] = {c: u for c, u in x["categories"].items() if c in known_cats or store_freq[c] >= 2}
    result.sort(key=lambda x: (x["prefSlug"], x["key"]))
    json.dump({"totalResults": total, "shops": result}, open(out, "w"), ensure_ascii=False, indent=1)
    print("results", total, "shops with evidence", len(result), "without name", sum(1 for x in result if not x["name"]))

if __name__ == "__main__":
    main(sys.argv[1:-2], sys.argv[-2], sys.argv[-1])
