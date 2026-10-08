"""本人SNS起点の発見：レビュー済みの採用候補を検証・統合し、店舗・出場者・部門relation をデータに書き出す。人物名は表示しない。
使い方: python3 sns_build.py ROUND... -- FU_ROUND..."""
import json, re, sys, glob, hashlib, unicodedata
from collections import Counter, defaultdict
sys.path.insert(0, ".")
from analyze import SHOP_RE, page_kind, title_name_area, PREF_NAME
REPO = "/home/user/name-missheaven-2026-map"
a = sys.argv[1:]; ROUNDS = a[:a.index("--")]; FU = a[a.index("--") + 1:]
n = lambda s: unicodedata.normalize("NFKC", s or "")
key = lambda s: re.sub(r"[\s・･/／、，,.。:：;；!！?？~～〜♡♥❤♪☆★◆◇■□●○※'\"`’”「」『』（）()［］\[\]【】〔〕{}｛｝<>＜＞\-‐－_＿|｜+＋&＆#＃*＊]", "", n(s).lower())
nm = lambda s: re.sub(r"(ちゃん|さん|たん)$", "", re.sub(r"[\s・･☆★♡♥❤()（）~～〜♪]", "", n(s)).lower())
H = lambda s: hashlib.sha256(s.encode()).hexdigest()[:16]
cu = lambda u: u.split("#")[0].split("?")[0]
S = json.load(open("nat/snap_disc.json")); E = json.load(open("nat/snap_disc_entrants.json")); CATS = set(json.load(open("nat/snap_disc_cats.json")))
byname = defaultdict(dict)
for s in S:
    for x in [s["name"]] + (s.get("names") or []): byname[key(x)][s["id"]] = s
known = {(e["storeId"], nm(e["name"])) for e in E}
storecats = {s["id"]: set(s["cats"]) for s in S}
PO = json.load(open("sns/pref_overrides.json"))
OV = json.load(open("sns/overrides.json")) if __import__("os").path.exists("sns/overrides.json") else {"exclude": []}
PREFS = list(PREF_NAME.values())
def pref_full(t):
    if not t: return None
    t = n(t)
    for p in PREFS:
        if t.startswith(p.rstrip("県府都")) or p.startswith(t): return p
    return None
# 追跡検索（店舗キー・店名・掲載地域）
fu = defaultdict(lambda: defaultdict(list))   # key -> {names:[(nm,area)]}
for r in FU:
    for e in json.load(open(f"sns/log_{r}.json")):
        for x in e["results"]:
            m = SHOP_RE.match(x["url"])
            if not m: continue
            k = "/".join(m.groups()[:4]); nmx, ar = title_name_area(x["title"], page_kind(m.groups()[4]))
            if nmx: fu[k]["names"].append((nmx, ar))
def find_key(store):
    c = Counter()
    for k, d in fu.items():
        for nmx, ar in d["names"]:
            if key(nmx) == key(store): c[k] += 1
    return c.most_common(1)[0][0] if len(c) == 1 else None   # 店名が一致する店舗キーがちょうど1つのときだけ
items = {o["cid"]: o for r in ROUNDS for o in json.load(open(f"sns/items_{r}.json"))}
dec = [d for r in ROUNDS for f in sorted(glob.glob(f"sns/decisions_{r}_*.json")) for d in json.load(open(f))]
excl = Counter(); cand = []
def clean_cat(c, text):
    if not c: return None
    c = c.strip(); m = re.match(r'^[「『【"“](.*)[」』】"”]$', c)
    if m: c = m.group(1).strip()
    if not c.endswith("部門") or n(c) not in text: return None
    return c
for d in dec:
    if not d.get("accept"): excl["reviewer_rejected"] += 1; continue
    it = items[d["cid"]]; text = n(it["title"] + " " + it["snippet"])
    if d["cid"] in OV["exclude"]: excl["manual_exclude"] += 1; continue
    if n(d["evidenceQuote"]) not in text: excl["quote_not_verbatim"] += 1; continue
    if not d.get("name") or key(d["name"]) not in key(text) or (key(d["storeName"]) not in key(text) and not d.get("viaKey")): excl["name_or_store_not_in_text"] += 1; continue
    if "2026" not in text or d.get("ownerKind") != "own": excl["no_2026_or_not_own"] += 1; continue
    cand.append(dict(d=d, it=it, text=text, cat=clean_cat(d.get("category"), text)))
# 店舗の解決
people = defaultdict(list); newstores = {}
for c in cand:
    d, it = c["d"], c["it"]
    ms = list(byname.get(key(d["storeName"]), {}).values())
    if d.get("prefecture"):
        pf = pref_full(d["prefecture"]); ms = [s for s in ms if pf and s["pref"] == pf] if ms else ms
    if len(ms) == 1:
        sid, pref, k = ms[0]["id"], ms[0]["pref"], None
    elif len(ms) > 1: excl["store_ambiguous"] += 1; continue
    else:
        k = find_key(d["storeName"]); pref = PREF_NAME.get(k.split("/")[0]) if k else None
        pt = pref_full(d.get("prefecture"))
        if pref and pt and pref != pt: excl["pref_conflict"] += 1; continue
        po = PO.get(d["cid"])
        if not po: excl["new_store_pref_unconfirmed"] += 1; continue
        pref = po["pref"]
        sid = "mh26-sns-store-" + H(k or (key(d["storeName"]) + "|" + pref))
        nmx = next((nmx for nmx, ar in fu[k]["names"] if key(nmx) == key(d["storeName"])), d["storeName"]) if k else d["storeName"]
        ars = Counter(ar for nmx2, ar in fu[k]["names"] if ar and key(nmx2) == key(d["storeName"])) if k else Counter()
        newstores.setdefault(sid, dict(po=po, storeId=sid, name=nmx, pref=pref, key=k, area=ars.most_common(1)[0][0] if ars else None, urls=[]))
    people[(sid, nm(d["name"]))].append(dict(c, sid=sid, pref=pref))
ROLE = dict(sourceType="entrant_social", accessStatus="search_index_only", publisherRole="entrant_social_found")
esrc, entrants, rels, ssrc, meta = {}, [], {}, {}, []
DUPS = []
def x_url(u): return cu(u)
for (sid, nk), ps in sorted(people.items(), key=lambda kv: kv[0]):
    if (sid, nk) in known:
        excl["duplicate_existing_person"] += 1; DUPS.append(dict(storeId=sid, xUrl=x_url(ps[0]["it"]["url"]), quote=ps[0]["d"]["evidenceQuote"][:80], viaKey=bool(ps[0]["d"].get("viaKey")))); continue
    handle = ps[0]["it"]["handle"]
    sids = []
    for p in ps:
        u = x_url(p["it"]["url"])
        if u not in esrc:
            esrc[u] = dict(sourceId="ent-src-d-" + H(u), url=u, **ROLE, storeIds=[], relationIds=[], checkedAt="2026-10-08",
                           notes="本人のXの公開投稿を、Yahoo!リアルタイム検索（robots.txtで許可されたXの公開投稿の検索）の結果で確認。本人からの掲載申請ではなく、検索で見つけた本人の出場表明（本人SNSで出場確認）")
        if sid not in esrc[u]["storeIds"]: esrc[u]["storeIds"].append(sid)
        if esrc[u]["sourceId"] not in sids: sids.append(esrc[u]["sourceId"])
        if sid in newstores: newstores[sid]["urls"].append(u)
    cats = Counter(p["cat"] for p in ps if p["cat"]); cat = cats.most_common(1)[0][0] if cats else None
    p0 = next((p for p in ps if p["cat"] == cat), ps[0]); q = p0["d"]["evidenceQuote"].strip()
    if "2026" not in q:
        i = p0["text"].find("2026"); q = p0["text"][max(0, i - 30):i + 25].strip(" .·") + " … " + q
    notes = None
    if cat and cat not in storecats.get(sid, set()):
        rk = (sid, cat)
        if rk not in rels: rels[rk] = dict(relationId="ent-rel-d-" + H(sid + "|" + cat), storeId=sid, categoryOriginal=cat, categoryNormalized=None, confidence="unverified", sourceIds=[], phase1RecordIds=[], notes="出場者本人のSNS（同じ情報源）に店舗・人物・部門が書かれている（検索で見つけた本人の出場表明）")
        for p in ps:
            if p["cat"] == cat:
                x = esrc[x_url(p["it"]["url"])]["sourceId"]
                if x not in rels[rk]["sourceIds"]: rels[rk]["sourceIds"].append(x)
        notes = "店舗×部門関係は同じ根拠から追加（entrantRelations）"
    entrants.append(dict(entrantId="mh26-ent-d-" + H(sid + "|" + nk), name=ps[0]["d"]["name"].strip(), storeId=sid, sourceIds=sids,
                         evidence=f"本人のX（プロフィール・投稿）に「{q}」" + (f"（同じ投稿群に、本人のプロフィールページへのリンクがあり、店舗パスは {ps[0]['d']['linkKey']}）" if ps[0]["d"].get("viaKey") else ""), evidenceDate=None, categoryOriginal=cat, personalUrl=f"https://x.com/{handle}" if handle else None,
                         confidence="unverified", checkedAt="2026-10-08",
                         notes=("本人SNSで出場確認（検索で発見。本人からの掲載申請ではない）" + ("。" + notes if notes else ""))))
    meta.append(dict(method=ps[0]["it"]["method"], sid=sid, new=sid in newstores, cat=cat, newrel=bool(notes)))
for r in rels.values():
    for s in esrc.values():
        if s["sourceId"] in r["sourceIds"] and r["relationId"] not in s["relationIds"]: s["relationIds"].append(r["relationId"])
# 新規店舗
stores = []
used = {sid for e in entrants for sid in [e["storeId"]]}
for sid, v in sorted(newstores.items()):
    if sid not in used: excl["new_store_without_person"] += 1; continue
    urls = list(dict.fromkeys(v["urls"]))
    for u in urls:
        s = ssrc.setdefault(u, dict(sourceId="sns-src-" + H(u), url=u, **ROLE, storeIds=[], relationIds=[], checkedAt="2026-10-08",
                                    notes="所属する出場者本人のX（プロフィール・投稿）の抜粋を、Yahoo!検索の結果で確認。本人からの掲載申請ではなく、検索で見つけた本人の出場表明"))
        s["storeIds"].append(sid)
    po = v["po"]
    if po.get("url"):
        s3 = ssrc.setdefault(po["url"], dict(sourceId="sns-src-" + H(po["url"]), url=po["url"], sourceType="entrant_social", accessStatus="search_index_only", publisherRole="third_party_social_found", storeIds=[], relationIds=[], checkedAt="2026-10-08",
                                    notes="都道府県の確認用。第三者のX投稿（Yahoo!リアルタイム検索で確認）。出場の根拠ではなく、所在地の確認のみ"))
        s3["storeIds"].append(sid); urls.append(po["url"]) if False else None
    pub = f"https://www.cityheaven.net/{v['key']}/" if v["key"] else None
    stores.append(dict(storeId=sid, storeName=v["name"], storeNameOriginals=[v["name"]], prefecture=v["pref"], listingArea=v["area"], listingAreas=[v["area"]] if v["area"] else [],
        formalElectionArea=None, categoryOriginal=None, categoryOriginals=[], participationEvidenceUrl=urls[0], storePublicUrl=pub, sourceType="entrant_social", confidence="unverified",
        participationType="entrant_sns_reported", checkedAt="2026-10-08", phase1RecordIds=[], phase2RecordIds=[], isNewSincePhase1=True, sourceIds=[ssrc[u]["sourceId"] for u in urls] + ([ssrc[v["po"]["url"]]["sourceId"]] if v["po"].get("url") else []),
        publicUrlAccessStatus="unknown", cityheavenKey=v["key"],
        notes="本人SNSで出場確認（2026-10-08。検索で発見。本人からの掲載申請ではない）。都道府県の根拠：" + v["po"]["note"] + "。公開ページURLは確認できていないため空欄。所属する出場者本人のSNSに2026年の出場表明があり、その中に店名が書かれていた。店舗自身の告知は確認していないため unverified。" + ("公開ページURLと掲載地域は、ヘブンの店舗ページのタイトルで店名が一致した店舗キーによる。" if v["key"] else "店舗の公開ページURL・掲載地域は未確認（推測しない）。") + "都道府県は" + ("ヘブンの店舗キー" if v["key"] else "本人の投稿の記載") + "による。正式選挙エリアは未確認。"))
json.dump(dict(description="本人SNSの出場表明を検索で見つけて確認し、追加した店舗（2026-10-08）。本人からの掲載申請ではない。人物名はここに書かない。", stores=stores, relations=[], sources=list(ssrc.values()), listingAreaUpdates=[], publicUrlUpdates=[]),
          open(f"{REPO}/data/stores/discovery-2026-10-08.json", "w"), ensure_ascii=False, indent=1)
json.dump(dict(description="本人SNSの出場表明を、検索の結果の抜粋で確認して追加した出場者（2026-10-08）。本人からの掲載申請ではない。部門は原文のまま。",
               entrants=entrants, sources=list(esrc.values()), relations=list(rels.values())), open(f"{REPO}/data/entrants/discovery-2026-10-08.json", "w"), ensure_ascii=False, indent=1)
mc = Counter(m["method"].split("_pref_")[0] if "_pref_" in m["method"] else m["method"] for m in meta)
json.dump(dict(persons=len(entrants), stores=len(stores), relations=len(rels), newCats=sorted({r["categoryOriginal"] for r in rels.values()} - CATS), existingStorePersons=sum(1 for m in meta if not m["new"]),
               withCategory=sum(1 for m in meta if m["cat"]), byMethod=dict(mc), excl=dict(excl)), open("sns/build_stats.json", "w"), ensure_ascii=False, indent=1)
json.dump(DUPS, open("sns/dup_confirmed.json","w"), ensure_ascii=False, indent=1)
print(json.load(open("sns/build_stats.json")))
