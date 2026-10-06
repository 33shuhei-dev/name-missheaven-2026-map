"""全国：保存済み検索結果から出場者候補を抽出する（新たな検索はしない）。人手確認用の一覧を出す。"""
import json, re, sys, unicodedata
from collections import defaultdict
sys.path.insert(0, ".")
from analyze import SHOP_RE, page_kind
REPO = "/home/user/name-missheaven-2026-map"
n = lambda s: unicodedata.normalize("NFKC", s or "")

# 店舗キー → storeId
key2store = {}
p3b = json.load(open(f"{REPO}/data/phase3b/stores.json"))["stores"]
for s in p3b: key2store[s["cityheavenKey"]] = (s["storeId"], s["storeName"], s["prefecture"])
for m in json.load(open(f"{REPO}/data/phase3b/research_log.json"))["matchedExisting"]:
    key2store[m["key"]] = (m["existingStoreId"], m["name"], m["prefecture"])
p3 = json.load(open(f"{REPO}/data/phase3/participating_stores_2026.json")); p3 = p3["stores"] if isinstance(p3, dict) else p3
for s in p3:
    for u in [s.get("storePublicUrl"), s.get("participationEvidenceUrl")]:
        m = SHOP_RE.match(u or "")
        if m: key2store.setdefault("/".join(m.groups()[:4]), (s["storeId"], s["storeName"], s.get("prefecture")))

rows = []
for lf in ["log_pref.json", "log_queue.json", "log_kanagawa_followup.json"]:
    for e in json.load(open(lf)):
        for r in e.get("results", []): rows.append(dict(r, q=e["query"]))
seen = {}
for r in rows: seen.setdefault(r["url"].split("#")[0].replace("smart.cityheaven", "www.cityheaven").replace("/t/", "/"), r)
rows = list(seen.values())

# 店舗ごとに、複数ページに同じ形で出る文（店舗共通の見出し・バナー）を集める
def frags(t):
    return {f.strip() for f in re.split(r"[.。·・…|｜!！]+|\s{2,}|\.\.\.", t) if len(f.strip()) >= 6}
store_rows = defaultdict(list)
for r in rows:
    m = SHOP_RE.match(r["url"])
    if m: store_rows["/".join(m.groups()[:4])].append(r)
shopwide = {}
for key, lst in store_rows.items():
    cnt = defaultdict(set)
    for r in lst:
        for f in frags(n(r["snippet"])): cnt[f].add(r["url"])
    shopwide[key] = {f for f, us in cnt.items() if len(us) >= 2}

MH = re.compile(r"ミスヘブン|総選挙|MISS ?HEAVEN", re.I)
STATE = re.compile(r"出場|エントリー|ノミネート|参加|挑戦|出馬|意気込み|部門")
out = []
for r in rows:
    m = SHOP_RE.match(r["url"])
    title, snip = n(r["title"]), n(r["snippet"])
    if m:
        key = "/".join(m.groups()[:4]); kind = page_kind(m.groups()[4])
        if m.group(1) == "kanagawa": continue  # 神奈川県は実証で確認済み
        own = " ".join(f for f in re.split(r"(?<=[.。·…!！])\s*", snip) if not any(f.strip(" .。·…").startswith(w[:12]) for w in shopwide.get(key, ())))
        rest = " ".join(x for x in re.split(r"[.。·・…|｜!！]+|\s{2,}|\.\.\.", snip) if x.strip() and x.strip() not in shopwide.get(key, set()))
        if not (MH.search(rest) and STATE.search(rest)): continue
        store = key2store.get(key)
        out.append(dict(key=key, kind=kind, store=store, url=r["url"], title=title, snippet=snip, own=rest, q=r["q"]))
    else:
        if "kanagawa" in r["url"] or "神奈川" in r["q"]: continue
        if not (MH.search(title + snip) and "2026" in title + snip and STATE.search(snip)): continue
        out.append(dict(key=None, kind="other", store=None, url=r["url"], title=title, snippet=snip, own=snip, q=r["q"]))
json.dump(out, open("national_candidates.json", "w"), ensure_ascii=False, indent=1)
from collections import Counter
print("candidates", len(out), Counter(o["kind"] for o in out), "no store", sum(1 for o in out if o["key"] and not o["store"]))
