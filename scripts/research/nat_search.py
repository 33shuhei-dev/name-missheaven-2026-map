"""全国展開：都道府県単位の検索（2パターン）。打ち切り条件つき。使い方: python3 nat_search.py ROUND MAXPAGES pref1 pref2 ..."""
import json, sys, os, glob, re, unicodedata
sys.path.insert(0, ".")
from ysearch import web
from analyze import SHOP_RE
BUDGET = 250
ROUND, MAXP, prefs = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
PATS = [("s1", '"ミスヘブンへの意気込み"'), ("s2", "ミスヘブン総選挙2026 部門 出場")]
nu = lambda u: u.split("#")[0].replace("smart.cityheaven", "www.cityheaven").replace("/t/", "/").rstrip("/")
seen = set()
for f in ["log_pref.json", "log_queue.json", "log_groupA.json", "log_kanagawa_followup.json", "log_pilot3.json"] + sorted(glob.glob("nat/log_*.json")):
    if os.path.exists(f) and not f.endswith(f"log_{ROUND}.json"):
        for e in json.load(open(f)):
            for r in e.get("results", []): seen.add(nu(r["url"]))
used = sum(len(json.load(open(f))) for f in glob.glob("nat/log_*.json") if not f.endswith(f"log_{ROUND}.json"))
out = []
SIG = re.compile(r"ミスヘブン|意気込み|部門|エントリー|ノミネート")
def promising(r, pref):
    m = SHOP_RE.match(r["url"])
    return bool(m and m.group(1) == pref and SIG.search(unicodedata.normalize("NFKC", r["title"] + " " + r["snippet"])) and nu(r["url"]) not in seen)
def run(pref, pat, terms, pg):
    global used
    if used >= BUDGET: return None
    q = f"site:www.cityheaven.net/{pref}/ {terms}"
    try: r = web(q, pg)
    except Exception as e: r = {"query": q, "page": pg, "results": [], "error": str(e)}
    used += 1
    good = sum(1 for x in r["results"] if promising(x, pref))
    for x in r["results"]: seen.add(nu(x["url"]))
    r.update(pref=pref, pattern=pat, promisingNew=good)
    out.append(r); json.dump(out, open(f"nat/log_{ROUND}.json", "w"), ensure_ascii=False, indent=1)
    print(ROUND, pref, pat, pg, len(r["results"]), "new", good, r.get("error", ""), "used", used, flush=True)
    return r
for pref in prefs:
    first = [run(pref, p, t, 1) for p, t in PATS]
    if any(f is None for f in first): print("BUDGET"); break
    if sum(f["promisingNew"] for f in first) == 0: print(pref, "STOP: first 2 searches empty", flush=True); continue
    for (p, t), f in zip(PATS, first):
        last = f
        for pg in range(2, MAXP + 1):
            if len(last["results"]) < 10 or last["promisingNew"] < 3: break  # 結果が尽きた・新しい有望ページがほぼない
            last = run(pref, p, t, pg)
            if last is None: break
print("done", ROUND, "queries", len(out), "used", used)
