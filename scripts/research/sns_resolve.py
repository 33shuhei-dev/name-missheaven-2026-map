"""採用候補の店舗を、現在のサイトの店舗（名前・表記違い）と照合し、既存人物との重複を判定する（人物名は表示しない）。"""
import json, re, sys, glob, unicodedata
from collections import Counter, defaultdict
n = lambda s: unicodedata.normalize("NFKC", s or "")
key = lambda s: re.sub(r"[\s・･/／、，,.。:：;；!！?？~～〜♡♥❤♪☆★◆◇■□●○※'\"`’”「」『』（）()［］\[\]【】〔〕{}｛｝<>＜＞\-‐－_＿|｜+＋&＆#＃*＊]", "", n(s).lower())
nm = lambda s: re.sub(r"[\s・･☆★♡♥❤()（）~～〜♪]", "", n(s)).lower()
S = json.load(open("nat/snap_sns.json")); E = json.load(open("nat/snap_sns_entrants.json"))
byname = defaultdict(list)
for s in S:
    for x in [s["name"]] + (s.get("names") or []): byname[key(x)].append(s)
known = {(e["storeId"], nm(e["name"])) for e in E}
rounds = sys.argv[1:]
items = {o["cid"]: o for r in rounds for o in json.load(open(f"sns/items_{r}.json"))}
dec = [d for r in rounds for f in sorted(glob.glob(f"sns/decisions_{r}_*.json")) for d in json.load(open(f))]
out = Counter(); rows = []
for d in dec:
    if not d.get("accept"): out["rejected"] += 1; continue
    it = items[d["cid"]]; text = n(it["title"] + " " + it["snippet"])
    if n(d["evidenceQuote"]) not in text: out["quote_not_verbatim"] += 1; continue
    if key(d["name"]) not in key(text) or key(d["storeName"]) not in key(text): out["name_or_store_not_in_text"] += 1; continue
    if "2026" not in text: out["no_2026"] += 1; continue
    ms = list({x["id"]: x for x in byname.get(key(d["storeName"]), [])}.values())
    if d.get("prefecture"): ms = [s for s in ms if n(d["prefecture"]).rstrip("県府都") in n(s["pref"])] if ms else ms
    st = "existing" if len(ms) == 1 else ("ambiguous" if len(ms) > 1 else ("new_pref_given" if d.get("prefecture") else "new_no_pref"))
    dup = bool(ms) and len(ms) == 1 and (ms[0]["id"], nm(d["name"])) in known
    out[st + ("_DUP_person" if dup else "")] += 1
    rows.append(dict(cid=d["cid"], status=st, dup=dup, storeId=ms[0]["id"] if len(ms) == 1 else None, store=d["storeName"], pref=(ms[0]["pref"] if len(ms) == 1 else d.get("prefecture")), cat=d.get("category")))
json.dump(rows, open("sns/resolved_" + "_".join(rounds) + ".json", "w"), ensure_ascii=False, indent=1)
print(dict(out))
for r in rows: print(r["cid"], r["status"], "DUP" if r["dup"] else "", "|", r["store"], "|", r["pref"], "|", r["cat"])
