# ミスヘブン総選挙2026 全国情報まとめ（非公式） v1

ミスヘブン総選挙2026について、**公開情報から確認できた**

- 都道府県
- 掲載地域
- 部門
- 店舗
- 出場者
- 情報源

を、47都道府県の日本地図と全国横断検索から探せる **非公式** のサイトです。

探索の流れは「全国地図 → 都道府県 → 掲載地域 → 部門 → 店舗 → 出場者 → 情報源」です。データにない階層は作りません。

## 非公式であること

- 主催者・公式サイト・掲載店舗・出場者とは関係ありません。全ページのヘッダーに「非公式」と表示しています。
- 公開情報をもとに、**確認できた範囲だけ**を掲載します。全出場者・全部門の網羅は保証しません。正式な選挙エリアを示すものでもありません。
- 人物写真・宣材画像は掲載しません。情報源の全文・画像は複製せず、リンクと必要最小限の事実だけを表示します。
- 候補情報（未確認）を含むため、`robots: noindex` を設定しています（`app/layout.tsx`）。

## 技術構成

| 項目 | 内容 |
| --- | --- |
| フレームワーク | Next.js 16（App Router）＋ React 19 |
| 言語 | TypeScript（strict） |
| スタイル | 素のCSS（`app/globals.css`） |
| 地図 | 自前の SVG（`data/japan-map.generated.ts`）。地図ライブラリは使っていない |
| テスト | Vitest |
| Lint | ESLint 9（eslint-config-next） |
| 出力 | 全ページをビルド時に静的生成（約310ページ）。Vercel にそのままデプロイ可能 |

ランタイム依存は `next` / `react` / `react-dom` のみです。

## ローカル起動方法

Node.js 20 以上（22 推奨）。

```bash
npm install
npm run dev            # http://localhost:3000
npm run typecheck      # 型チェック
npm run lint           # ESLint
npm test               # テスト一式
npm run validate:data  # 本番データ（Phase 1）の検証だけ
npm run build          # production build
npm run check          # typecheck → lint → test → build
```

## 画面と URL

| URL | 内容 |
| --- | --- |
| `/` | トップ。全国地図（凡例・地方拡大）、全国検索、全国の状況、都道府県一覧 |
| `/pref/[slug]` | 都道府県。調査状態、観測・部門・掲載地域・店舗・出場者の件数、掲載地域ごとの部門、店舗、出場者。情報のない県は「調査済み・現在確認できた情報なし」の表示 |
| `/pref/unknown` | 地域未判明（都道府県を確認できていない観測） |
| `/pref/[slug]/area/[areaId]` | 掲載地域。部門・店舗 |
| `/division/[id]` | 部門。部門名（原文）・都道府県・掲載地域・正式選挙エリア（未確認）・店舗・確認状態・観測ごとの情報源 |
| `/store/[id]` | 店舗（v1 で追加）。部門と出場者、観測ごとの情報源 |
| `/search` | 全国横断検索（都道府県・掲載地域・部門・店舗・出場者。種別・都道府県・掲載地域・確認状態で絞り込み） |
| `/categories` | 部門一覧（部門名で絞り込み、都道府県・確認状態で絞り込み、件数順など） |
| `/about` | このサイトについて |

### v0.1 からの URL の変更

- 既存のルート（`/`・`/search`・`/pref/[slug]`・`/pref/[slug]/area/[areaId]`・`/division/[id]`・`/categories`・`/about`）はすべて維持しています。
- `/store/[id]` を追加しました。
- `/pref/unknown` は同じ URL のまま、表示名を「都道府県未判明」から「地域未判明」に変えました。
- 部門ID・掲載地域IDは「都道府県・掲載地域・部門名」から決まります。データが v0.1 の調査候補から Phase 1 データに入れ替わったため、v0.1 時点の個別の部門・エリアの URL は残っていません（v0.1 は公開前のため影響なし）。

## データ

### ファイル構成

```
data/
  phase1/                         Phase 1 最終成果物（受け取ったまま無変更）
    nationwide_dataset_v1.json    全観測レコード（147件）
    map_47prefectures_v1.json     47都道府県の地図状態・県別集計
    sources_v1.json               情報源URL別の役割（参照用）
    kpi_comparison_v1.json        Phase 1 の開始・終了KPI（テストで照合）
    validation_v1.json ほか        Phase 1 の検証結果・報告書・引き継ぎ書
    SHA256SUMS                    上記ファイルのハッシュ（テストで改変を検出）
  updates.ts                      Phase 1 以降の差分更新（v1 時点は空）
  types.ts                        型定義
  geo.ts                          地方・都道府県マスタ（JIS コード順）
  japan-map.generated.ts          地図の SVG パス（scripts/generate-japan-map.mjs で生成）
lib/
  data.ts        データの唯一の入口（読み込み → 検証 → 変換 → 画面用モデル）
  phase1.ts      アダプター（Phase 1 JSON → SiteRecord）
  validate.ts    レコード・地図データ・summary の検証
  model.ts       集計 summarize()、都道府県 → 掲載地域 → 部門 → 店舗 → 出場者 の組み立て
  search.ts      全国横断検索
  insights.ts    全国比較（将来の「珍しい部門」等の素材。画面にはまだ出していない）
  text.ts        日本語検索用の正規化
  links.ts       安全な外部リンク判定
  labels.ts      確認状態・地図状態などの日本語表示
```

### Phase 1 データとの追跡可能性

- Phase 1 の JSON は手で別形式にコピーせず、**そのまま** `data/phase1/` に置いて読み込みます。`SHA256SUMS` と照合するテストがあり、改変されるとテストが失敗します。
- `lib/phase1.ts` のアダプターは null を「未判明」に変えるだけです。部門名などの文字列は変えません。レコード ID もそのまま使います。
- ビルド時に次を検証し、食い違いがあればビルドを失敗させます。
  - レコードの形式（ID重複、confidence・sourceType の値、都道府県名、URL、日付など）
  - `map_47prefectures_v1.json` の47県の状態・件数を、レコードから再集計した値と照合
  - `nationwide_dataset_v1.json` の `summary` を、レコードから再集計した値と照合

### 主なフィールドとサイトでの扱い

| フィールド | 扱い |
| --- | --- |
| `id` | そのまま維持 |
| `prefecture` | null は「地域未判明」へ。地名・部門名・店舗名から推定しない |
| `listingArea` | 情報源の掲載・営業地域。**サイトの地域階層に使う** |
| `formalElectionArea` | 正式選挙エリア。v1 は全件 null → 「未確認（掲載地域とは別）」と表示。listingArea や店舗所在地から補完しない |
| `categoryOriginal` | 表示上の正式名称（掲載原文）。似た名前も統合しない |
| `categoryNormalized` | 検索補助のみ |
| `storeName` / `entrantNames`（なければ `entrantName`） | ある範囲だけ表示。null は「未判明」 |
| `sourceUrl` / `regionSourceUrl` | 部門の情報源・地域の情報源として別々にリンク |
| `confidence` / `categoryConfidence` / `regionConfidence` | 総合の確認状態と、部門名・地域それぞれの確認状態 |
| `sourceAccessStatus` | 「情報源の本文を確認」「検索結果の表示のみ」などの日本語で表示 |
| `notes` | 「根拠・留保（調査メモ）」として折りたたみ表示 |

### 件数の定義（Phase 1 の地図データと同じ）

- 観測：レコード数
- 部門：部門名（原文）の種類数
- 掲載地域：listingArea の種類数
- 店舗：店舗名（原文）の種類数
- 出場者：店舗名×人物名の数。実際の人数の重複排除ではなく、同姓同名の別人を統合することもしない

全国・都道府県・掲載地域のどの単位でも、同じ `summarize()` で集計します。画面の数値はすべてデータからの自動集計で、固定値は持っていません。

## 確認状態（confidence）と地図の状態

| confidence | 画面表示 | 意味 |
| --- | --- | --- |
| `confirmed` | 確認済み | 一次性の高い情報源で、掲載県・掲載地域と2026年の部門の関係を確認できたもの。正式選挙エリアの証明ではない |
| `probable` | 有力情報 | 根拠は比較的強いが、申込段階の留保・関係の不一致などが残るもの |
| `unverified` | 未確認情報 | 転載・検索結果のみなど、確認が不足しているもの |

| 地図の状態 | 画面表示 | 地図の色 |
| --- | --- | --- |
| `confirmed` | 確認済み情報あり | 紺（塗りつぶし） |
| `candidate` | 候補情報あり | 薄紫の斜線（確認済みと見た目を分ける） |
| `searched_no_evidence` | 現在確認できた情報なし | 灰色。「存在しない」「出場者がいない」とは表示しない |

地図の色は人気・順位・出場者数ではなく、**調査状態**を表します。トップに凡例と状態別の県数（データから集計）を表示しています。

## 全国地図

- `scripts/generate-japan-map.mjs` で作った静的な SVG パスです。元データは jpn-atlas@1.0.2（BSD-3-Clause）で、出典は国土地理院「地球地図日本」です。
  - 県境を共有したまま簡略化しているため、県の間に隙間ができません。
  - 伊豆・小笠原諸島や与論島付近より南の小島は省略しています。
  - 沖縄県は拡大して左上の枠内に表示しています。枠全体をタップすると沖縄県のページを開きます。
- 各県は都道府県ページへのリンクです。JavaScript なしでも動作します。
- スマホでは東京・大阪・香川などが小さいため、「東北・関東・中部・近畿・中国・四国・九州・沖縄」の拡大ボタンを用意しています。拡大すると県名も表示されます。
- 地図の下に地方別の都道府県一覧もあり、地図を使わなくても47都道府県すべてにたどり着けます。
- 地図を作り直すとき：

```bash
npm pack jpn-atlas@1.0.2 && tar xzf jpn-atlas-1.0.2.tgz
node scripts/generate-japan-map.mjs package/japan/japan.json > data/japan-map.generated.ts
```

## 新しいデータの追加・訂正（差分更新）

Phase 1 データは凍結済みの基準データです。今後は、新しく公開された具体的な情報に基づいて差分だけを追加します。

1. `data/updates.ts` に Phase 1 と同じ形のレコードを追加します。
   - ID は Phase 1 と重複しないもの（例：`mh26-upd-0001`）
   - 部門名・店舗名・人物名は情報源の表記のまま
   - 不明な項目は null（空文字・推測で埋めない）
   - confirmed にするには `sourceUrl` が必須
2. `npm run validate:data` と `npm run build` を実行します。

UI のコードを修正する必要はありません。地図の状態は「confirmed の観測があれば確認済み／観測があれば候補／なければ情報なし」でデータから決まるので、差分を追加すると地図にも反映されます。`map_47prefectures_v1.json` との照合は Phase 1 レコードだけを対象にしているため、差分を追加してもビルドは止まりません。

既存の Phase 1 レコードを訂正する場合は、新しい ID の訂正レコードを追加します（元のレコードは監査のため残す）。訂正が多くなったら、Phase 2 として新しい成果物一式に入れ替えるのが安全です。その場合は `data/phase1/` と同じ構成で置き、`lib/data.ts` の読み込み先を変えます。

## テスト

`npm test`（95件）で次を検証します。

- 47都道府県が存在し重複がないこと、地図の状態がデータと整合していること
- 確認済み・候補・情報なしの県数の集計
- 全国集計・県別集計が Phase 1 の summary・KPI・地図データと一致すること
- 全国検索、表記揺れ（記号・カナ・絵文字・`categoryNormalized`）、絞り込み
- categoryOriginal を原文のまま保持すること
- listingArea と formalElectionArea の分離
- 県不明レコード（38件）を保持すること
- 部分データ、空データ
- 外部URL
- 不正データでの検証失敗（ID重複、地図の改変、summary の不一致など）
- Phase 1 ファイルの改変検出、出場者リンク先の整合

## GitHub / Vercel

- **Vercel**：リポジトリをインポートするだけでデプロイできます（Framework は Next.js、Build は `npm run build`、環境変数は不要）。
- **CI**：GitHub Actions で `npm ci && npm run check` を実行すると、検証エラーのあるデータがマージされるのを防げます。
- **データ更新の流れ**：新情報を確認 → `data/updates.ts` を編集する PR → CI で検証 → マージ → 自動デプロイ。

## 今後の拡張（Future）

- **発見する機能**：「その県だけの部門」「全国で数地域しかない部門」「情報が少ない県」など。素材は `lib/insights.ts` にあります。しきい値と、どの確認状態を根拠にするかは、画面にするときに決めます。未確認の候補だけで「珍しい」と断定しないこと。
- **地図の指標の切り替え**：部門数・確認済み件数などで色分けすること。都道府県ごとの集計値は `PrefectureView.summary` にあります。
- **新着**：現在は `checkedAt`（確認日）しかありません。発見日を別の項目にするか、`data/updates.ts` の Git 履歴から求めるかは今後決めます。
