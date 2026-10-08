> **使用禁止（2026-10-08）**: `search.yahoo.co.jp/search?`（Yahoo!通常のWeb検索）は robots.txt で Disallow です。
> このREADMEの下にある走査手順・`ysearch.py` とそれを使うスクリプトは、**過去の調査の記録**であり、再実行しないでください（`ysearch.py` は読み込むと停止します）。
> 許可された経路だけを使います（例: Yahoo!リアルタイム検索 `/realtime/` = `rt_search.py`）。新しい情報源は、公開・アクセス条件・robots.txt・利用規約・ログイン不要を確認してから使います。
> 経緯・結果・停止判断: `discovery_results.md` ／ 分析: `discovery_gap_analysis.md` ／ 直接根拠の置き換え候補: `direct_evidence_candidates.json` ／ Yahoo依存データの対応表: `yahoo_dependence_map.json`

# Phase 3b 全国走査スクリプト

ミスヘブン総選挙2026 の参加店舗を、検索エンジン（Yahoo! JAPAN）の索引から都道府県単位で探すための調査用スクリプト。
サイトの実行時には使わない。成果物は `data/phase3b/` に出力される。

- CityHeaven へ直接アクセスしない（調査環境からは 403。回避も試みない）
- 検索の取得結果（キャッシュ・ログ）には人物名を含む抜粋があるため、リポジトリには入れない
- 人物名・人物ページのURLは成果物に出力しない

実行順（作業ディレクトリで）:

```bash
python3 discover.py pref         # 47都道府県の検索（log_pref.json）
python3 crawlqueue.py            # 失敗ページの再取得・店名特定・深掘り（log_queue.json）
python3 merge.py                 # 統合と店舗抽出（query_plan.json, shops_final.json）
python3 build_phase3b.py         # data/phase3b/ へ出力（既存データとの照合・重複排除）
```

検索エンジンへの負荷を避けるため、リクエスト間隔は `YS_DELAY`（秒、既定 6）で調整し、429 を受けたら長く待つ。
