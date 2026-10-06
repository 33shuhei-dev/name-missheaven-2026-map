"""全国展開：全ラウンドのレビュー結果を検証・統合し、店舗・地域・URL・出場者・部門relation を repo のデータに書き出す（累積・IDは内容のハッシュで安定）。
人物名は表示しない（件数だけ）。使い方: python3 nat_build.py r1 r2 ..."""
import json, re, sys, glob, hashlib, unicodedata
from collections import Counter, defaultdict
sys.path.insert(0, ".")
from analyze import PREF_NAME, SHOP_RE
REPO = "/home/user/name-missheaven-2026-map"
ROUNDS = sys.argv[1:]
n = lambda s: unicodedata.normalize("NFKC", s or "")
key = lambda s: re.sub(r"[\s・･/／、，,.。:：;；!！?？~～〜♡♥❤♪☆★◆◇■□●○※'\"`’”「」『』（）()［］\[\]【】〔〕{}｛｝<>＜＞\-‐－_＿|｜+＋&＆#＃*＊]", "", n(s).lower())
nm = lambda s: re.sub(r"[\s・･☆★♡♥❤()（）~～〜♪]", "", n(s)).lower()
cu = lambda u: u.split("#")[0].split("?")[0]  # 情報源URLはクエリ（セッションID等）を除いて保存する
H = lambda s: hashlib.sha256(s.encode()).hexdigest()[:16]
OV = json.load(open("nat/overrides.json"))
snap = json.load(open("nat/snap_base.json")); snapE = json.load(open("nat/snap_base_entrants.json"))
S = {s["id"]: s for s in snap}
known = {(e["storeId"], nm(e["name"])) for e in snapE}
storecats = {s["id"]: set(s["cats"]) for s in snap}
allcats = set(json.load(open("nat/snap_base_cats.json")))
p1 = set()
for r in json.load(open(f"{REPO}/data/phase1/nationwide_dataset_v1.json"))["records"]:
    for e in (r.get("entrantNames") or ([r["entrantName"]] if r.get("entrantName") else [])):
        p1.add((n(r.get("prefecture") or r.get("storePrefecture") or ""), nm(r.get("storeName")), nm(e)))
items, dec = {}, []
for R in ROUNDS:
    for o in json.load(open(f"nat/items_{R}.json")): items[o["cid"]] = o
    for f in sorted(glob.glob(f"nat/decisions_{R}_*.json")): dec += json.load(open(f))
problems, excl = [], Counter()
exclP = defaultdict(Counter)
store_ev = defaultdict(list); persons = []
for d in dec:
    it = items.get(d["cid"])
    if not it: problems.append((d["cid"], "unknown cid")); continue
    text = it["title"] + " " + it["snippet"]; pref = it["pref"]
    if d.get("type") == "store":
        if d.get("storeParticipation") == "explicit":
            q = n(d.get("storeQuote"))
            if q and q in n(text) and ("2026" in text or re.search(r"\d{1,2}/\d{1,2}", text)): store_ev[it["key"]].append((d["cid"], d["storeQuote"]))
            else: problems.append((d["cid"], "store quote"))
        continue
    def bad(reason): excl[reason] += 1; exclP[pref][reason] += 1
    if d["cid"] + "|" + d.get("name", "") in OV["excludePersons"]: bad("weak_statement_not_explicit"); continue
    q = n(d.get("evidenceQuote"))
    if d.get("key") not in (None, it["key"]): bad("key_mismatch"); continue
    if not q or q not in n(text): bad("quote_not_verbatim"); continue
    if not d.get("name") or key(d["name"]) not in key(text): bad("name_not_in_text"); continue
    if (d.get("sourceKind") or "own_page") in ("own_page", "own_diary"):
        rest = n(it.get("textWithoutStoreWideHeaders", ""))
        frs = [f for f in re.split(r"[.。·・…|｜!！\s]+", q) if len(f) >= 8]
        if not any(f in rest or f in n(it["title"]) for f in frs): bad("store_wide_header_only"); continue
    cat = OV["categoryFix"].get(d["cid"] + "|" + d["name"], d.get("category"))
    if cat and (not cat.endswith("部門") or n(cat) not in n(text)): cat = None  # 部門名は原文どおり（本文にそのまま現れるものだけ）
    date = d.get("evidenceDate")
    if "2026" not in text and not (date and re.match(r"^2026-(08|09|10)-\d\d$", date)): bad("year_not_2026"); continue
    persons.append(dict(cid=d["cid"], name=d["name"].strip(), key=it["key"], storeId=it.get("storeId"), category=cat, quote=d["evidenceQuote"],
                        date=None if "2026" in text else date, kind=d.get("sourceKind") or "own_page", url=it["url"], pref=pref, pattern=it["pattern"]))
    store_ev[it["key"]].append((d["cid"], d["evidenceQuote"]))
# 新規店舗
by_key = defaultdict(list)
for it in items.values(): by_key[it["key"]].append(it)
# 同じ店舗キーの、これまでの検索結果のタイトル（店名・掲載地域の補助。推測ではなく実際のページのタイトル）
from analyze import page_kind, title_name_area
prior_titles = defaultdict(list)
for f in ["log_pref.json", "log_queue.json", "log_groupA.json", "log_kanagawa_followup.json", "log_pilot3.json"] + sorted(glob.glob("nat/log_*.json")):
    for e in json.load(open(f)):
        for r in e.get("results", []):
            m = SHOP_RE.match(r["url"])
            if m:
                nm_, ar_ = title_name_area(n(r["title"]), page_kind(m.groups()[4]))
                if nm_: prior_titles["/".join(m.groups()[:4])].append((nm_, ar_))
snapnames = defaultdict(set)
for s in snap:
    for x in [s["name"]] + (s.get("names") or []): snapnames[s["pref"]].add(key(x))
newstores, newkey_status = {}, {}
for k, lst in by_key.items():
    if lst[0].get("storeId"): continue
    pages = list(dict.fromkeys(c for c, _ in store_ev.get(k, [])))
    has_person = any(p["key"] == k for p in persons)
    titles = [(it["titleStoreName"], it.get("titleArea")) for it in lst if it.get("titleStoreName")] + prior_titles.get(k, [])
    names = Counter(t[0] for t in titles)
    pref = k.split("/")[0]; P = PREF_NAME[pref]
    if not pages: st = "none"
    elif not names: st = "no_store_name"
    elif not (len(pages) >= 2 or has_person): st = "weak"
    elif key(names.most_common(1)[0][0]) in snapnames[P]: st = "name_matches_existing_other_key"
    else: st = "add"
    newkey_status[k] = dict(status=st, pref=pref, pages=len(pages))
    if st == "add":
        nm0 = names.most_common(1)[0][0]
        # 地域：店名が一致するページのタイトルにある掲載地域だけ
        ar = Counter(a for t, a in titles if a and t == nm0)
        newstores[k] = dict(storeId="mh26-nat-store-" + H(k), name=nm0, area=ar.most_common(1)[0][0] if ar else None, pref=P, slug=pref, pages=pages)
# ラウンド間の店舗IDの解決
def sid_of(p):
    if p["storeId"]: return p["storeId"]
    ns = newstores.get(p["key"]); return ns["storeId"] if ns else None
ROLE = {"own_page": ("本人のページ", "entrant_diary", "entrant_page"), "own_diary": ("本人の写メ日記", "entrant_diary", "entrant_page"),
        "other_entrant": ("同じ店舗の出場者のページ", "entrant_diary", "entrant_page"), "store_notice": ("店舗の告知", "store", "store_announcement")}
# 店舗データ
stores, ssrc = [], {}
def store_src(cid, sid, why):
    it = items[cid]; u = cu(it["url"])
    if u not in ssrc:
        kind = next((p["kind"] for p in persons if p["cid"] == cid), None)
        stype, role = (ROLE[kind][1], ROLE[kind][2]) if kind in ROLE else (("entrant_diary", "entrant_page") if it["kind"] in ("cast", "diary") else ("store", "store_public_page"))
        ssrc[u] = dict(sourceId="nat-src-" + H(u), url=u, sourceType=stype, accessStatus="search_index_only", publisherRole=role, storeIds=[], relationIds=[], checkedAt="2026-10-06",
                       notes=f"全国展開（2026-10-06）のYahoo!検索の結果の抜粋で確認（ページ本文は調査環境から取得していない）。{why}")
    if sid not in ssrc[u]["storeIds"]: ssrc[u]["storeIds"].append(sid)
    return ssrc[u]["sourceId"]
for k, v in sorted(newstores.items()):
    sids = list(dict.fromkeys(store_src(c, v["storeId"], "2026年の参加・出場を示す記載。") for c in v["pages"]))
    nP = len(sids)
    stores.append(dict(storeId=v["storeId"], storeName=v["name"], storeNameOriginals=[v["name"]], prefecture=v["pref"], listingArea=v["area"], listingAreas=[v["area"]] if v["area"] else [],
        formalElectionArea=None, categoryOriginal=None, categoryOriginals=[], participationEvidenceUrl=cu(items[v["pages"][0]]["url"]), storePublicUrl=f"https://www.cityheaven.net/{k}/",
        sourceType=ssrc[cu(items[v["pages"][0]]["url"])]["sourceType"], confidence="probable" if nP >= 2 else "unverified", participationType="search_index_reported", checkedAt="2026-10-06",
        phase1RecordIds=[], phase2RecordIds=[], isNewSincePhase1=True, sourceIds=sids, publicUrlAccessStatus="unknown",
        verificationMethod="search_index_multiple" if nP >= 2 else "search_index_single", evidencePageCount=nP, cityheavenKey=k,
        notes=f"全国展開（2026-10-06）。Yahoo!検索の結果で、ヘブン掲載のこの店舗のページに2026年の参加・出場を示す記載を確認（{nP}ページ）。ページ本文は取得していないため検索結果の抜粋による。都道府県・公開ページURLはヘブンの掲載URL（店舗キー）、掲載地域はページタイトルの表記による（タイトルにない場合は未判明のまま）。正式選挙エリアは未確認。"))
# 既存店舗の地域・URL補完（店舗キーが一致し、タイトルの店名が既存の店名と一致するページだけ）
areaUpd, urlUpd = [], []
for k, lst in by_key.items():
    sid = lst[0].get("storeId")
    if not sid or sid not in S: continue
    s = S[sid]; okn = {key(x) for x in [s["name"]] + (s.get("names") or [])}
    match = [it for it in lst if it.get("titleStoreName") and key(it["titleStoreName"]) in okn]
    if not s["areas"]:
        ar = Counter(it["titleArea"] for it in match if it.get("titleArea"))
        if len(ar) == 1:
            a = next(iter(ar)); src = [store_src(it["cid"], sid, f"ページタイトルの掲載地域「{a}」（店舗キーと店名が既存の店舗と一致）。") for it in match if it.get("titleArea") == a][:2]
            areaUpd.append(dict(storeId=sid, listingArea=a, sourceIds=src, notes="ページタイトルの掲載地域表記による（正式選挙エリアではない）。"))
    if not s["url"] and match:
        src = [store_src(match[0]["cid"], sid, "店舗キーと店名が既存の店舗と一致。")]
        urlUpd.append(dict(storeId=sid, storePublicUrl=f"https://www.cityheaven.net/{k}/", sourceIds=src, notes="ヘブンの店舗キーによる（検索結果のURLの店舗部分）。"))
# 出場者
groups = defaultdict(list)
for p in persons:
    sid = sid_of(p)
    if not sid:
        st = newkey_status.get(p["key"], {}).get("status", "none")
        excl["store_not_added_" + st] += 1; exclP[p["pref"]]["store_not_added_" + st] += 1; continue
    if p["kind"] not in ROLE: excl["source_kind"] += 1; exclP[p["pref"]]["source_kind"] += 1; continue
    groups[(sid, nm(p["name"]))].append(p)
storeinfo = {**{sid: (s["pref"], s["name"]) for sid, s in S.items()}, **{v["storeId"]: (v["pref"], v["name"]) for v in newstores.values()}}
esrc, entrants, rels = {}, [], {}
def evidence(p):
    it = items[p["cid"]]; text = n(it["title"]) + " " + n(it["snippet"]); q = n(p["quote"])
    if "2026" not in q and not p["date"]:
        i = text.find("2026"); start = max(0, text.rfind(".", 0, i) + 1, i - 30)
        q = f"{text[start:i + 25].strip(' .·')} … {q}"
    return f"{ROLE[p['kind']][0]}に「{q.strip()}」"
for (sid, k), ps in sorted(groups.items(), key=lambda kv: (storeinfo[kv[0][0]], kv[0][1])):
    P, sname = storeinfo[sid]; pref = ps[0]["pref"]
    if (sid, k) in known: excl["duplicate_existing_record"] += 1; exclP[pref]["duplicate_existing_record"] += 1; continue
    if (n(P), nm(sname), k) in p1: excl["duplicate_phase1"] += 1; exclP[pref]["duplicate_phase1"] += 1; continue
    sids = []
    for p in ps:
        p["url"] = cu(p["url"])
        if p["url"] not in esrc:
            esrc[p["url"]] = dict(sourceId="ent-src-n-" + H(p["url"]), url=p["url"], sourceType=ROLE[p["kind"]][1], accessStatus="search_index_only", publisherRole=ROLE[p["kind"]][2],
                                  storeIds=[], relationIds=[], checkedAt="2026-10-06", notes="Yahoo!検索の結果の抜粋で確認（ページ本文は調査環境から取得していない）。全国展開（2026-10-06）")
        s = esrc[p["url"]]
        if sid not in s["storeIds"]: s["storeIds"].append(sid)
        if s["sourceId"] not in sids: sids.append(s["sourceId"])
    cats = Counter(p["category"] for p in ps if p["category"]); cat = cats.most_common(1)[0][0] if cats else None
    evp = [p for p in ps if not cat or p["category"] == cat] or ps
    ev = evidence(evp[0]); date = None if "2026" in ev else next((p["date"] for p in evp if p["date"]), None)
    notes = None
    if cat and cat not in storecats.get(sid, set()):
        rk = (sid, cat)
        if rk not in rels:
            rels[rk] = dict(relationId="ent-rel-n-" + H(sid + "|" + cat), storeId=sid, categoryOriginal=cat, categoryNormalized=None, confidence="unverified", sourceIds=[], phase1RecordIds=[],
                            notes="出場者の根拠（同じ情報源）に店舗・人物・部門が書かれている（全国展開）")
        for p in evp:
            x = esrc[p["url"]]["sourceId"]
            if x not in rels[rk]["sourceIds"]: rels[rk]["sourceIds"].append(x)
        notes = "店舗×部門関係は同じ根拠から追加（entrantRelations）"
    entrants.append(dict(entrantId="mh26-ent-n-" + H(sid + "|" + k), name=ps[0]["name"], storeId=sid, sourceIds=sids, evidence=ev, evidenceDate=date, categoryOriginal=cat,
                         personalUrl=None, confidence="unverified", checkedAt="2026-10-06", notes=notes, _pref=pref, _kind=evp[0]["kind"], _pattern=min(p["pattern"] for p in ps), _new=sid.startswith("mh26-nat-")))
for r in rels.values():
    for s in esrc.values():
        if s["sourceId"] in r["sourceIds"] and r["relationId"] not in s["relationIds"]: s["relationIds"].append(r["relationId"])
meta = [{k: e.pop(k) for k in ["_pref", "_kind", "_pattern", "_new"]} | {"storeId": e["storeId"], "cat": e["categoryOriginal"]} for e in entrants]
json.dump(dict(description="全国展開（2026-10-06）で新たに確認した参加関連店舗と、既存店舗の掲載地域・公開ページURLの補完。人物名はここに書かない。",
               stores=stores, relations=[], sources=list(ssrc.values()), listingAreaUpdates=areaUpd, publicUrlUpdates=urlUpd),
          open(f"{REPO}/data/stores/national-2026-10-06.json", "w"), ensure_ascii=False, indent=1)
json.dump(dict(description="全国展開（2026-10-06）で記録した出場者。検索結果の抜粋で、2026年の出場・エントリーと店舗が確認できたものだけ。部門は原文のまま。",
               entrants=entrants, sources=list(esrc.values()), relations=list(rels.values())),
          open(f"{REPO}/data/entrants/national-2026-10-06.json", "w"), ensure_ascii=False, indent=1)
# 集計（件数のみ）
stats = defaultdict(Counter)
valid = defaultdict(set)
for k, v in store_ev.items():
    for c, _ in v: valid[items[c]["pref"]].add(c)
for pf, cs in valid.items(): stats[pf]["validPages"] = len(cs)
for v in newstores.values(): stats[v["slug"]]["newStores"] += 1; stats[v["slug"]]["newStoreArea"] += bool(v["area"])
for k, v in newkey_status.items(): stats[v["pref"]]["newKey_" + v["status"]] += 1
for m in meta:
    stats[m["_pref"]]["entrants"] += 1; stats[m["_pref"]]["kind_" + m["_kind"]] += 1; stats[m["_pref"]]["pattern_" + m["_pattern"]] += 1
strengthened = defaultdict(set)
for m in meta:
    if not m["_new"]: strengthened[m["_pref"]].add(m["storeId"])
for u in areaUpd + urlUpd: strengthened[S[u["storeId"]]["prefSlug"]].add(u["storeId"])
for pf, ss in strengthened.items(): stats[pf]["existingStrengthened"] = len(ss)
for pf in {m["_pref"] for m in meta}:
    stats[pf]["storesWithNewEntrants"] = len({m["storeId"] for m in meta if m["_pref"] == pf})
    stats[pf]["storesNewlyWithEntrants"] = len({m["storeId"] for m in meta if m["_pref"] == pf and (m["_new"] or S[m["storeId"]]["entrants"] == 0)})
for (sid, cat) in rels:
    pf = next(m["_pref"] for m in meta if m["storeId"] == sid); stats[pf]["newRelations"] += 1
newcats = {c for (_, c) in rels} - allcats
for c in newcats:
    pfs = {next(m["_pref"] for m in meta if m["storeId"] == sid) for (sid, cc) in rels if cc == c}
    for pf in pfs: stats[pf]["newCategoryOriginal"] += 1
for u in areaUpd: stats[S[u["storeId"]]["prefSlug"]]["areaFillExisting"] += 1
for u in urlUpd: stats[S[u["storeId"]]["prefSlug"]]["urlFillExisting"] += 1
for pf, c in exclP.items():
    for r, x in c.items(): stats[pf]["excl_" + r] += x
json.dump(dict(stats={k: dict(v) for k, v in stats.items()}, excl=dict(excl), problems=problems, newCategoryOriginalCount=len(newcats)), open("nat/stats.json", "w"), ensure_ascii=False, indent=1)
print("problems", len(problems), Counter(p[1] for p in problems))
print("stores", len(stores), "areaUpd", len(areaUpd), "urlUpd", len(urlUpd), "entrants", len(entrants), "relations", len(rels), "newCats", len(newcats))
print("excl", dict(excl))
