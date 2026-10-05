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
