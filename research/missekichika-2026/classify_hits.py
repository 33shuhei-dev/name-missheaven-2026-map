"""sweep_shops.py / area_titles.py で集めた投稿を、人（駅ちかの女の子ID）ごとにまとめ、出場表明の強さで分ける。
使い方: python3 -I classify_hits.py OUT.json HITS.jsonl...
判定（自動の一次判定。最後は人が本文を読んで決める）
- 出場表明: ミス駅ちか／駅ちか総選挙の語の近く（前後120字）に「出場・エントリー・参加・ノミネート・出ます・でます・出る」等がある、
  または「ミス駅ちか2026 出場中」等の公式バナー文言がある。ただし同じ文の中でミスヘブンにだけ掛かる表現は除く
- 投票依頼のみ: 駅ちかの語はあるが、本人の出場を示す語がない
- 投稿者が女の子本人でない（店舗スタッフ・ニュース）ものは「店舗告知」として別に扱う
"""
import json, re, sys, collections

KW = re.compile(r"ミス\s*駅|駅[ちチ][かカ]\S{0,8}総選挙|駅[ちチ][かカ]\s*総選挙|駅♡か|MISS\s*EKICHIKA", re.I)
ENTRY = re.compile(r"出場|エントリー|参加(させ|する|します|しま|になり|が決|中|して|いた|決定|予定)|出て(る|い|ます)|出ちゃ|ノミネート|出ます|でます|出る(こと|ことに|よ|の)|でることに|"
                   r"出させて|挑戦|代表|選ばれ|推薦|決まり|決定|パネル")
BANNER = re.compile(r"(ミス駅ちか|MISS\s*EKICHIKA).{0,40}(出場中|エントリー中|参加中)", re.I)
HEAVEN = re.compile(r"ミス\s*ヘ|ヘブン|ヘ♡ン|天国")
DIV = re.compile(r"(デリヘル|ヘルス|ソープ|人妻|熟女|お姉さん|ギャル|キレカワ|ロリ|おっぱい|風俗エステ|メンズエステ|メンエス)\s*[/／・]?\s*\S{0,6}部門")


def grade(text):
    t = re.sub(r"\s+", " ", text)
    if BANNER.search(t): return "出場表明", BANNER.search(t).group(0)
    best = None
    for m in KW.finditer(t):
        w = t[max(0, m.start() - 120):m.end() + 120]
        e = ENTRY.search(w)
        if e:
            # 「ミスヘブン…出場」だけが近くにある場合は除く
            seg = t[min(m.start(), max(0, m.start() - 120) + e.start()):max(m.end(), max(0, m.start() - 120) + e.end())]
            if HEAVEN.search(seg) and not KW.search(seg[:len(seg)]): continue
            return "出場表明", w
        best = best or w
    return ("投票依頼のみ", best) if best else ("語なし", "")


def main(out, paths):
    hits = []
    for p in paths:
        for l in open(p, encoding="utf-8"):
            hits.append(json.loads(l))
    seen, people, news = set(), collections.defaultdict(list), []
    for h in hits:
        if h.get("kind") == "news": news.append(h); continue
        if h["diary_id"] in seen: continue
        seen.add(h["diary_id"])
        g, w = grade(h["title"] + " ／ " + h["body"])
        div = DIV.findall(h["title"] + h["body"])
        people[h.get("poster_url") or (h["shop"] + "#" + h["poster"])].append(
            dict(diary_id=h["diary_id"], posted=h["posted"], title=h["title"], grade=g, window=w,
                 divisions=sorted(set(div)), list_url=h["list_url"], shop=h["shop"], shop_name=h.get("shop_name", ""),
                 poster=h["poster"]))
    res = []
    for k, ps in people.items():
        ps.sort(key=lambda x: x["posted"])
        order = {"出場表明": 0, "投票依頼のみ": 1, "語なし": 2}
        best = min(ps, key=lambda x: (order[x["grade"]], x["posted"]))
        res.append(dict(person=k, poster=ps[0]["poster"], shop=ps[0]["shop"], shop_name=ps[0]["shop_name"],
                        grade=best["grade"], best=best, n_posts=len(ps),
                        divisions=sorted({d for p in ps for d in p["divisions"]}), posts=ps))
    res.sort(key=lambda r: (r["grade"], r["shop"]))
    json.dump(dict(people=res, news=news), open(out, "w"), ensure_ascii=False, indent=1)
    c = collections.Counter(r["grade"] for r in res)
    print("人", len(res), dict(c), "ニュース", len(news))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2:])
