"""本人SNS起点の発見：レビュー済みの採用候補を検証・統合し、店舗・出場者・部門relation をデータに書き出す。人物名は表示しない。
使い方: python3 sns_build.py ROUND... -- FU_ROUND..."""
import json, re, sys, glob, hashlib, unicodedata
from collections import Counter, defaultdict
sys.path.insert(0, ".")
from place_pref import pref_from_store_name
from analyze import SHOP_RE, page_kind, title_name_area, PREF_NAME
REPO = "/home/user/name-missheaven-2026-map"
a = sys.argv[1:]; ROUNDS = a[:a.index("--")]; FU = a[a.index("--") + 1:]
n = lambda s: unicodedata.normalize("NFKC", s or "")
key = lambda s: re.sub(r"[\s・･/／、，,.。:：;；!！?？~～〜♡♥❤♪☆★◆◇■□●○※'\"`’”「」『』（）()［］\[\]【】〔〕{}｛｝<>＜＞\-‐－_＿|｜+＋&＆#＃*＊]", "", n(s).lower())
nm = lambda s: re.sub(r"(ちゃん|さん|たん)$", "", re.sub(r"[\s・･☆★♡♥❤()（）~～〜♪]", "", n(s)).lower())
H = lambda s: hashlib.sha256(s.encode()).hexdigest()[:16]
cu = lambda u: u.split("#")[0].split("?")[0]
S = json.load(open("nat/snap_hvbase.json")); E = json.load(open("nat/snap_hvbase_entrants.json")); CATS = set(json.load(open("nat/snap_hvbase_cats.json")))
byname = defaultdict(dict)
for s in S:
    for x in [s["name"]] + (s.get("names") or []): byname[key(x)][s["id"]] = s
known = {(e["storeId"], nm(e["name"])) for e in E}
storecats = {s["id"]: set(s["cats"]) for s in S}
PO = {}
KEYS = {}
for s in S:
    if s.get("url"):
        _m = re.search(r"cityheaven\.net/(.+?)/?$", s["url"])
        if _m: KEYS[_m.group(1)] = s
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

import datetime
items = {}
for r in ROUNDS:
    for o in json.load(open(f"sns/items_{r}.json")): items[o["cid"]] = o
dec = [d for r in ROUNDS for f in sorted(glob.glob(f"sns/decisions_{r}_*.json")) for d in json.load(open(f))]
excl = Counter(); cand = []
TIER = {"own": "own", "store_staff": "store", "fan": "third"}
def clean_cat(c, text):
    if not c: return None
    c = c.strip(); m = re.match(r'^[「『【"“](.*)[」』】"”]$', c)
    if m: c = m.group(1).strip()
    if not c.endswith("部門") or n(c) not in text: return None
    return c
def posted_ok(it):
    pd = it.get("postedDate")
    return bool(pd) and pd >= "2026-08-01"
for d0 in dec:
    if not d0.get("accept"): excl["reviewer_rejected"] += 1; continue
    if d0["cid"] in OV["exclude"]: excl["manual_exclude"] += 1; continue
    it = items[d0["cid"]]; text = n(it["title"] + " " + it["snippet"])
    tier = d0.get("tier") or TIER.get(d0.get("ownerKind"), None)
    if tier not in ("own", "store", "third"): excl["tier_unknown"] += 1; continue
    if n(d0["evidenceQuote"]) not in text: excl["quote_not_verbatim"] += 1; continue
    has2026 = "2026" in text
    if not has2026 and not (d0.get("windowOk") and posted_ok(it) and "ミスヘブン" in text): excl["no_2026_and_no_window"] += 1; continue
    persons = [(d0["name"], d0.get("category"))] + [(o["name"], o.get("category")) for o in (d0.get("others") or []) if o.get("name")]
    for pname, pcat in persons:
        d = dict(d0, name=pname, category=pcat)
        if not pname or key(pname) not in key(text): excl["name_not_in_text"] += 1; continue
        if key(d["storeName"]) not in key(text) and not (d.get("viaKey") and d.get("linkKey") in KEYS): excl["store_not_in_text"] += 1; continue
        if not has2026 and key(d["storeName"]) not in key(it["snippet"]) and not (d.get("viaKey") and d.get("linkKey") in KEYS): excl["window_store_only_in_display_name"] += 1; continue
        cand.append(dict(d=d, it=it, text=text, tier=tier, cat=clean_cat(pcat, text), dated=None if has2026 else it.get("postedDate")))
# 店舗の解決（都道府県が分からない店舗は「地域未判明」で載せる：2026-10-29 の運営判断）
people = defaultdict(list); newstores = {}
def sid_of(k, name, pref):
    return ("mh26-sns-store-" + H(k or (key(name) + "|" + pref))) if pref else ("mh26-hv-store-" + H(k or key(name)))
def _prio(c):
    d = c["d"]
    return 0 if (d.get("viaKey") and d.get("linkKey")) else (1 if (d.get("prefecture") or pref_from_store_name(d["storeName"])) else 2)
cand.sort(key=_prio)
planned = {}
for c in cand:
    d, it = c["d"], c["it"]
    if d.get("viaKey") and d.get("linkKey"):
        lk = d["linkKey"]
        if lk in KEYS:
            s0 = KEYS[lk]; people[(s0["id"], nm(d["name"]))].append(dict(c, sid=s0["id"], pref=s0["pref"])); continue
        pk = PREF_NAME.get(lk.split("/")[0])
        if not pk: excl["key_pref_unknown"] += 1; continue
        sid = sid_of(lk, d["storeName"], pk)
        newstores.setdefault(sid, dict(po=dict(note="プロフィールページへのリンクの店舗パス（" + lk + "）の都道府県"), storeId=sid, name=d["storeName"], pref=pk, key=lk, area=None, urls=[]))
        planned.setdefault(key(d["storeName"]), (sid, pk))
        people[(sid, nm(d["name"]))].append(dict(c, sid=sid, pref=pk)); continue
    ms = list(byname.get(key(d["storeName"]), {}).values())
    if d.get("prefecture"):
        pf = pref_full(d["prefecture"]); ms = [s for s in ms if pf and s["pref"] == pf] if ms else ms
    if len(ms) == 1:
        sid, pref = ms[0]["id"], ms[0]["pref"]
    elif len(ms) > 1: excl["store_ambiguous"] += 1; continue
    elif key(d["storeName"]) in planned and not pref_full(d.get("prefecture")):
        sid, pref = planned[key(d["storeName"])]
    else:
        pt = pref_full(d.get("prefecture"))
        if pt:
            po = dict(note="投稿に都道府県の記載（" + d["prefecture"] + "）")
        else:
            pp = pref_from_store_name(d["storeName"])
            if pp: pt = pp[0]; po = dict(note=f"店名中の地名「{pp[1]}」（{pp[0]}にしかない地名。2026-10-27 の運営判断で、一つの都道府県にしかない地名に限り根拠とする）")
            else: po = dict(note="投稿に都道府県の記載がなく、地域未判明のまま掲載（2026-10-29 の運営判断）")
        pref = pt
        sid = sid_of(None, d["storeName"], pref)
        newstores.setdefault(sid, dict(po=po, storeId=sid, name=d["storeName"], pref=pref, key=None, area=None, urls=[]))
        planned.setdefault(key(d["storeName"]), (sid, pref))
    people[(sid, nm(d["name"]))].append(dict(c, sid=sid, pref=pref))
RANK = {"own": 0, "store": 1, "third": 2}
ROLE_BY = {"own": "entrant_social_found", "store": "store_announcement", "third": "third_party_social_found"}
WHO = {"own": "本人のX", "store": "店舗（または所属グループ）のX投稿", "third": "第三者（ファンなど）のX投稿"}
NOTE_BY = {"own": "本人SNSで出場確認（検索で発見。本人からの掲載申請ではない）",
           "store": "店舗のXの投稿で出場を確認（出場者本人の投稿ではない。未確認）",
           "third": "第三者のXの投稿で出場を確認（出場者本人の投稿ではない。未確認）"}
esrc, entrants, rels, ssrc, meta = {}, [], {}, {}, []
DUPS = []
def x_url(u): return cu(u)
store_tier = {}
for (sid, nk), ps in sorted(people.items(), key=lambda kv: kv[0]):
    if (sid, nk) in known:
        excl["duplicate_existing_person"] += 1; DUPS.append(dict(storeId=sid, xUrl=x_url(ps[0]["it"]["url"]), quote=ps[0]["d"]["evidenceQuote"][:80], viaKey=bool(ps[0]["d"].get("viaKey")))); continue
    ps = sorted(ps, key=lambda p: RANK[p["tier"]])
    tier = ps[0]["tier"]
    store_tier[sid] = min(store_tier.get(sid, "third"), tier, key=lambda t: RANK[t])
    handle = ps[0]["it"]["handle"]
    sids = []
    for p in ps:
        u = x_url(p["it"]["url"])
        if u not in esrc:
            esrc[u] = dict(sourceId="ent-src-h-" + H(u), url=u, sourceType="entrant_social" if p["tier"] == "own" else "store", accessStatus="search_index_only", publisherRole=ROLE_BY[p["tier"]], storeIds=[], relationIds=[], checkedAt="2026-10-29",
                           notes=f"{WHO[p['tier']]}の公開投稿を、Yahoo!リアルタイム検索（robots.txtで許可されたXの公開投稿の検索）の結果で確認（投票期間の定期収集）。" + ("本人からの掲載申請ではなく、検索で見つけた本人の出場表明" if p["tier"] == "own" else "出場者本人の投稿ではなく、未確認の情報"))
        if sid not in esrc[u]["storeIds"]: esrc[u]["storeIds"].append(sid)
        if esrc[u]["sourceId"] not in sids: sids.append(esrc[u]["sourceId"])
        if sid in newstores: newstores[sid]["urls"].append(u)
    cats = Counter(p["cat"] for p in ps if p["cat"]); cat = cats.most_common(1)[0][0] if cats else None
    p0 = next((p for p in ps if p["cat"] == cat), ps[0]); q = p0["d"]["evidenceQuote"].strip()
    if "2026" not in q and "2026" in p0["text"]:
        i = p0["text"].find("2026"); q = p0["text"][max(0, i - 30):i + 25].strip(" .·") + " … " + q
    notes = None
    if cat and cat not in storecats.get(sid, set()):
        rk = (sid, cat)
        if rk not in rels: rels[rk] = dict(relationId="ent-rel-h-" + H(sid + "|" + cat), storeId=sid, categoryOriginal=cat, categoryNormalized=None, confidence="unverified", sourceIds=[], phase1RecordIds=[], notes="同じ情報源に店舗・人物・部門が書かれている（" + ("出場者本人の投稿" if tier == "own" else "出場者本人の投稿ではない・未確認") + "）")
        for p in ps:
            if p["cat"] == cat:
                x = esrc[x_url(p["it"]["url"])]["sourceId"]
                if x not in rels[rk]["sourceIds"]: rels[rk]["sourceIds"].append(x)
        notes = "店舗×部門関係は同じ根拠から追加（entrantRelations）"
    link_note = (f"（同じ投稿に、プロフィールページへのリンクがあり、店舗パスは {ps[0]['d']['linkKey']}）" if ps[0]["d"].get("viaKey") else "")
    date_note = (f"（年の表記はないが、投稿日 {p0['dated']}。投票期間中の投稿）" if p0.get("dated") else "")
    entrants.append(dict(entrantId=("mh26-ent-h-" if tier == "own" else "mh26-ent-t-") + H(sid + "|" + nk), name=ps[0]["d"]["name"].strip(), storeId=sid, sourceIds=sids,
                         evidence=f"{WHO[tier]}に「{q}」" + link_note + date_note + ("" if tier == "own" else "（出場者本人の投稿ではない）"),
                         evidenceDate=p0["dated"] if p0.get("dated") else None, categoryOriginal=cat, personalUrl=f"https://x.com/{handle}" if (tier == "own" and handle) else None,
                         confidence="unverified", checkedAt="2026-10-29",
                         notes=NOTE_BY[tier] + ("。" + notes if notes else "")))
    meta.append(dict(method=ps[0]["it"]["method"], sid=sid, new=sid in newstores, cat=cat, newrel=bool(notes), tier=tier))
for r in rels.values():
    for s in esrc.values():
        if s["sourceId"] in r["sourceIds"] and r["relationId"] not in s["relationIds"]: s["relationIds"].append(r["relationId"])
stores = []
used = {e["storeId"] for e in entrants}
for sid, v in sorted(newstores.items()):
    if sid not in used: excl["new_store_without_person"] += 1; continue
    urls = list(dict.fromkeys(v["urls"]))
    st = store_tier.get(sid, "third")
    for u in urls:
        s = ssrc.setdefault(u, dict(sourceId="hv-src-" + H(u), url=u, sourceType="entrant_social" if st == "own" else "store", accessStatus="search_index_only", publisherRole=ROLE_BY[st], storeIds=[], relationIds=[], checkedAt="2026-10-29",
                                    notes=f"所属する出場者の{WHO[st]}の公開投稿を、Yahoo!リアルタイム検索（robots.txtで許可）の結果で確認。" + ("本人からの掲載申請ではなく、検索で見つけた本人の出場表明" if st == "own" else "出場者本人の投稿ではなく、未確認の情報")))
        if sid not in s["storeIds"]: s["storeIds"].append(sid)
    po = v["po"]
    if po.get("url"):
        s3 = ssrc.setdefault(po["url"], dict(sourceId="hv-src-" + H(po["url"]), url=po["url"], sourceType="entrant_social", accessStatus="search_index_only", publisherRole="third_party_social_found", storeIds=[], relationIds=[], checkedAt="2026-10-29", notes="都道府県の確認用。第三者のX投稿。出場の根拠ではなく、所在地の確認のみ"))
        s3["storeIds"].append(sid)
    pub = f"https://www.cityheaven.net/{v['key']}/" if v["key"] else None
    stores.append(dict(storeId=sid, storeName=v["name"], storeNameOriginals=[v["name"]], prefecture=v["pref"], listingArea=v["area"], listingAreas=[v["area"]] if v["area"] else [],
        formalElectionArea=None, categoryOriginal=None, categoryOriginals=[], participationEvidenceUrl=urls[0], storePublicUrl=pub, sourceType="entrant_social" if st == "own" else "store", confidence="unverified",
        participationType="entrant_sns_reported" if st == "own" else "third_party_reported", checkedAt="2026-10-29", phase1RecordIds=[], phase2RecordIds=[], isNewSincePhase1=True,
        sourceIds=[ssrc[u]["sourceId"] for u in urls] + ([ssrc[po["url"]]["sourceId"]] if po.get("url") else []),
        publicUrlAccessStatus="unknown", cityheavenKey=v["key"],
        notes=("本人SNSで出場確認（検索で発見。本人からの掲載申請ではない）" if st == "own" else "店舗または第三者のSNS投稿で出場の記載を確認（出場者本人の投稿ではない。未確認）") + "。都道府県の根拠：" + po["note"] + ("。公開ページURLは本人のプロフィールリンクの店舗パス。" if v["key"] else "。公開ページURLは確認できていないため空欄。") + "掲載地域・正式選挙エリアは未確認。"))
json.dump(dict(description="投票期間の定期収集で確認して追加した店舗（2026-10-27〜）。人物名はここに書かない。", stores=stores, relations=[], sources=list(ssrc.values()), listingAreaUpdates=[], publicUrlUpdates=[]),
          open(f"{REPO}/data/stores/harvest-2026-10-27.json", "w"), ensure_ascii=False, indent=1)
json.dump(dict(description="投票期間の定期収集で確認して追加した出場者（2026-10-27〜）。部門は原文のまま。",
               entrants=entrants, sources=list(esrc.values()), relations=list(rels.values())), open(f"{REPO}/data/entrants/harvest-2026-10-27.json", "w"), ensure_ascii=False, indent=1)
mc = Counter(m["tier"] for m in meta)
json.dump(dict(persons=len(entrants), stores=len(stores), relations=len(rels), newCats=sorted({r["categoryOriginal"] for r in rels.values()} - CATS), byTier=dict(mc), unknownPrefStores=sum(1 for s in stores if not s["prefecture"]),
               withCategory=sum(1 for m in meta if m["cat"]), excl=dict(excl)), open("sns/build_stats.json", "w"), ensure_ascii=False, indent=1)
json.dump(DUPS, open("sns/dup_confirmed.json", "w"), ensure_ascii=False, indent=1)
print(json.load(open("sns/build_stats.json")))
