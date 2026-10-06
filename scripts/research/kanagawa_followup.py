"""神奈川県の実証：出場人数の告知はあるが名前が抜粋にない店舗に、店舗パス限定の検索を1回ずつ追加する。"""
import json, sys
sys.path.insert(0, ".")
from ysearch import web
STORES = ["kanagawa/A1403/A140301/hibiki_k", "kanagawa/A1403/A140304/t-hitodumajo", "kanagawa/A1405/A140503/office-love",
          "kanagawa/A1401/A140103/onemorecoming", "kanagawa/A1406/A140602/atsugi-jojoen", "kanagawa/A1401/A140104/y-hitodumajo",
          "kanagawa/A1401/A140103/moecosu", "kanagawa/A1401/A140103/nicelady", "kanagawa/A1403/A140301/one_kyouto",
          "kanagawa/A1403/A140301/bijin-kenkyujo"]
out = []
for key in STORES:
    q = f"site:www.cityheaven.net/{key}/ ミスヘブン 2026 部門 意気込み"
    try:
        r = web(q)
    except Exception as e:
        r = {"query": q, "results": [], "error": str(e)}
    print(key, len(r["results"]), r.get("error", ""), flush=True)
    out.append(r)
json.dump(out, open("log_kanagawa_followup.json", "w"), ensure_ascii=False, indent=1)
