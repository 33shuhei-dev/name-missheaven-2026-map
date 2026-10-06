import json
r=json.load(open('nat/report.json')); t=r['totals']
EX={'weak_statement_not_explicit':'出場の明言なし','store_wide_header_only':'店舗共通の見出しのみ','store_not_added_no_store_name':'店名が確認できない店舗','store_not_added_name_matches_existing_other_key':'既存店舗と同名・別キー','duplicate_existing_record':'既存の記録と重複'}
L=["# 全国展開（2026-10-06）","","検索：Yahoo!検索、都道府県のヘブン配下に限定（`site:www.cityheaven.net/{県}/`）。","- s1: `\"ミスヘブンへの意気込み\"` / s2: `ミスヘブン総選挙2026 部門 出場`（「ノミネート 部門」は不使用）","- 打ち切り：最初の2検索で有望ページ0→県を終了／1ページで新しい有望ページが3件未満→その検索方法を終了／予算250。","- 既に分析済みのページ（Phase 3b・再解析・パイロット）はレビュー対象から除外。","","## 都道府県別","","| 都道府県 | 検索 | 有効ページ | 新規店舗 | 新規人物 | 既存店舗強化 | 新規relation | 新規categoryOriginal | 地域補完 | URL補完 | 除外 | 人物/検索 | 主な除外理由 |","|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|"]
for x in r['rows']:
    ex='、'.join(f"{EX[k]}{v}" for k,v in sorted(x['excl'].items(),key=lambda kv:-kv[1])) or '—'
    L.append(f"| {x['pref']} | {x['searches']} | {x['valid']} | {x['newStores']} | {x['entrants']} | {x['strengthened']} | {x['relations']} | {x['newCats']} | {x['area']} | {x['url']} | {x['excluded']} | {x['perSearch']} | {ex} |")
L+=["",f"地域補完・URL補完は新規店舗の分を含む（既存店舗の補完は地域 {t['areaFillExisting']}・URL {t['urlFillExisting']}）。新規categoryOriginalは都道府県ごとに数えた（全国では {t['newCategoryOriginal']} 種類）。","",
"## 全国合計","",f"- 検索数 {t['searches']}（s1 {t['searchesByPattern']['s1']}・s2 {t['searchesByPattern']['s2']}）",
f"- 検索方法別：s1 新規人物 {t['entrantsByPattern']['s1']}人（{t['perSearchByPattern']['s1']}人/検索）、s2 {t['entrantsByPattern']['s2']}人（{t['perSearchByPattern']['s2']}人/検索）",
f"- 根拠別の採用：本人のページ {t['evidenceKinds'].get('own_page',0)}、本人の写メ日記 {t['evidenceKinds'].get('own_diary',0)}、店舗の告知 {t['evidenceKinds'].get('store_notice',0)}",
"- 除外：" + '、'.join(f"{EX[k]} {v}" for k,v in t['excl'].items()),
f"- 店舗 {t['before']['stores']}→{t['after']['stores']}、出場者のいる店舗 {t['before']['storesWithEntrants']}→{t['after']['storesWithEntrants']}、店舗に結び付く出場者 {t['before']['entrants']}→{t['after']['entrants']}、部門名 {t['before']['categoryNames']}→{t['after']['categoryNames']}",
f"- 新規店舗 {t['newStores']}（地域あり {t['newStoreArea']}）、新規人物 {t['newEntrants']}、新規relation {t['newRelations']}、新規categoryOriginal {t['newCategoryOriginal']}"]
open('/home/user/name-missheaven-2026-map/scripts/research/nationwide_expansion.md','w').write('\n'.join(L)+'\n')
