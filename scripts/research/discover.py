"""フェーズA：47都道府県＋部門名での検索を実行し、結果をすべて記録する（店舗の判定は後段）。"""
import json, sys, time
sys.path.insert(0, ".")
from ysearch import web

PREFS = [("hokkaido","北海道"),("aomori","青森"),("iwate","岩手"),("miyagi","宮城"),("akita","秋田"),("yamagata","山形"),("fukushima","福島"),("ibaraki","茨城"),("tochigi","栃木"),("gunma","群馬"),("saitama","埼玉"),("chiba","千葉"),("tokyo","東京"),("kanagawa","神奈川"),("niigata","新潟"),("toyama","富山"),("ishikawa","石川"),("fukui","福井"),("yamanashi","山梨"),("nagano","長野"),("gifu","岐阜"),("shizuoka","静岡"),("aichi","愛知"),("mie","三重"),("shiga","滋賀"),("kyoto","京都"),("osaka","大阪"),("hyogo","兵庫"),("nara","奈良"),("wakayama","和歌山"),("tottori","鳥取"),("shimane","島根"),("okayama","岡山"),("hiroshima","広島"),("yamaguchi","山口"),("tokushima","徳島"),("kagawa","香川"),("ehime","愛媛"),("kochi","高知"),("fukuoka","福岡"),("saga","佐賀"),("nagasaki","長崎"),("kumamoto","熊本"),("oita","大分"),("miyazaki","宮崎"),("kagoshima","鹿児島"),("okinawa","沖縄")]

def run(tag, query, max_pages, log):
    for page in range(1, max_pages + 1):
        try:
            r = web(query, page)
        except Exception as e:
            log.append({"tag": tag, "query": query, "page": page, "error": str(e), "results": []})
            break
        r["tag"] = tag
        log.append(r)
        if len(r["results"]) < 10:
            break

def main(which):
    log = []
    if which == "pref":
        for slug, name in PREFS:
            qs = [
                (f'site:www.cityheaven.net/{slug}/ "ミスヘブン総選挙2026"', 5),
                (f'site:www.cityheaven.net/{slug}/ ミスヘブン 2026 エントリー', 3),
                (f'site:www.cityheaven.net/{slug}/ ミスヘブン 2026 ノミネート', 3),
                (f'site:smart.cityheaven.net/{slug}/ ミスヘブン 2026', 3),
                (f'"ミスヘブン総選挙2026" {name} -site:cityheaven.net', 2),
            ]
            for q, mp in qs:
                run(f"pref:{slug}", q, mp, log)
            print(slug, sum(len(x["results"]) for x in log if x.get("tag") == f"pref:{slug}"), flush=True)
            json.dump(log, open(f"log_pref.json", "w"), ensure_ascii=False)
    elif which == "cat":
        cats = json.load(open("categories.json"))
        for c in cats:
            run(f"cat:{c}", f'"{c}" ミスヘブン 2026 site:cityheaven.net', 2, log)
        for q in ['"ミスヘブン総選挙2026" 部門 site:cityheaven.net', '"ミスヘブン総選挙2026" エントリー site:cityheaven.net', '"ミスヘブン総選挙2026" ノミネート site:cityheaven.net', '"2026ミスヘブン" site:cityheaven.net', '"ミスヘブン2026" site:cityheaven.net']:
            run("national", q, 10, log)
        json.dump(log, open("log_cat.json", "w"), ensure_ascii=False)
        print("cat done", len(log))

if __name__ == "__main__":
    main(sys.argv[1])
