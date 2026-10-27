"""投票期間の定期収集：Yahoo!リアルタイム検索（/realtime/。robots.txt で許可）の最新投稿を、キャッシュを使わずに取得して保存する。
リアルタイム検索は1クエリあたり最新の約600件しか返さないため、投票期間中に数時間おきに実行して、新しい投稿を積み上げる。
使い方: python3 rt_harvest.py OUT_DIR   （OUT_DIR/harvest_YYYYmmddTHHMM.json に保存。人物名を含むためリポジトリには入れない）
禁止: Yahoo!通常のWeb検索（robots.txt で Disallow）は使わない。"""
import json, os, re, subprocess, sys, time, urllib.parse
from datetime import datetime, timezone

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
QUERIES = ["ミスヘブン 投票", "ミスヘブン総選挙2026", "ミスヘブン 地方予選", "ミスヘブン 応援"]
MAX_PAGES, DELAY = 15, float(os.environ.get("YS_DELAY", "3"))


def fetch(q, start):
    url = "https://search.yahoo.co.jp/realtime/search?p=" + urllib.parse.quote(q) + "&ei=UTF-8" + (f"&start={start}" if start > 1 else "")
    for attempt in range(3):
        p = subprocess.run(["curl", "-sS", "--compressed", "--max-time", "25", "-A", UA, "-H", "Accept-Language: ja-JP,ja;q=0.9", "-w", "\n__HTTP__%{http_code}", url],
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
        body, _, code = p.stdout.rpartition("\n__HTTP__")
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', body, re.S)
        if code == "200" and m:
            tl = json.loads(m.group(1))["props"]["pageProps"]["pageData"].get("timeline") or {}
            return tl.get("head", {}).get("totalResultsAvailable", 0), tl.get("entry", [])
        time.sleep(10 * (attempt + 1))
    return 0, []


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    now = datetime.now(timezone.utc)
    rows, seen = [], set()
    for q in QUERIES:
        start = 1
        for _ in range(MAX_PAGES):
            total, es = fetch(q, start)
            for e in es:
                u = e["url"].split("?")[0]
                if u in seen:
                    continue
                seen.add(u)
                urls = [(x.get("expandedUrl") or x.get("url")) for x in (e.get("urls") or []) if isinstance(x, dict)]
                rows.append(dict(url=u, name=e.get("name"), screen=e.get("screenName"), at=e.get("createdAt"), query=q,
                                 text=re.sub(r"\tSTART\t|\tEND\t", "", e.get("displayTextBody") or ""), urls=urls))
            time.sleep(DELAY)
            if len(es) < 5 or start + 40 > total:
                break
            start += 40
    path = os.path.join(out_dir, "harvest_" + now.strftime("%Y%m%dT%H%M") + ".json")
    json.dump(dict(fetchedAt=now.isoformat(), queries=QUERIES, rows=rows), open(path, "w"), ensure_ascii=False)
    print(path, len(rows), "posts", sum(1 for r in rows if any("cityheaven.net" in u and "girlid" in u for u in r["urls"])), "with profile links")


if __name__ == "__main__":
    main(sys.argv[1])
