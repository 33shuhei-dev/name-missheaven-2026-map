# ミスヘブン総選挙2026 非公式全国マップ（v0.1）

ミスヘブン総選挙2026について全国に分散している

- 都道府県
- エリア
- 部門
- 出場者
- 店舗
- 確認元

の情報を、スマートフォンから全国横断で探せるようにする **非公式** の情報整理サイトです。

「他県にはどんな部門がある？」「この地域には誰が出ている？」「同じような部門が全国のどこにある？」「この出場者・店舗はどの部門？」を探せることを目的にしています。変わった部門だけでなく、普通の部門も含めて全国を見渡せるようにします。

## 非公式であること

- 主催者・公式サイト・掲載店舗・出場者とは一切関係ありません。全ページのヘッダーとフッターに「非公式」と表示しています。
- 人物写真や公式の宣材画像は掲載しません。
- 確認できていない情報を事実として表示しません（下記「confidence」参照）。
- v0.1 は未確認の調査候補が中心のため、`robots: noindex` を設定しています（`app/layout.tsx`）。確認済みデータが増えた段階で見直してください。

## 技術構成

| 項目 | 内容 |
| --- | --- |
| フレームワーク | Next.js 16（App Router）＋ React 19 |
| 言語 | TypeScript（strict） |
| スタイル | 素のCSS（`app/globals.css`）。UIライブラリなし |
| テスト | Vitest |
| Lint | ESLint 9（eslint-config-next） |
| データ | TypeScriptファイル（`data/`）。DB・ログイン・管理画面なし |
| 出力 | 全ページをビルド時に静的生成（SSG）。Vercel にそのままデプロイ可能 |

ランタイム依存は `next` / `react` / `react-dom` のみです。

## ローカル起動方法

Node.js 20 以上（22 推奨）が必要です。

```bash
npm install
npm run dev          # 開発サーバー http://localhost:3000
```

その他のコマンド:

```bash
npm run typecheck    # TypeScript 型チェック
npm run lint         # ESLint
npm test             # テスト一式
npm run validate:data # 本番データ（data/）の検証だけを実行
npm run build        # production build
npm start            # build 後の本番サーバー
npm run check        # typecheck → lint → test → build をまとめて実行
```

## 画面構成

| URL | 内容 |
| --- | --- |
| `/` | トップ。非公式表記、全国検索、データから自動算出した掲載状況、地方→都道府県の選択 |
| `/search` | 全国横断検索（キーワード＋都道府県・エリア・確認状態で絞り込み。条件はURLに保存） |
| `/pref/[slug]` | 都道府県。エリアごとの部門一覧。データ0件の県も表示 |
| `/pref/unknown` | 都道府県未判明の情報（部門名だけ判明しているもの等） |
| `/pref/[slug]/area/[areaId]` | エリア。部門一覧と「部門未判明の情報」 |
| `/division/[id]` | 部門詳細。部門名（原文）・都道府県・エリア・出場者・店舗・確認状態・確認元、同名部門／表記が似た部門 |
| `/categories` | 全国の部門名一覧（表記が似た部門名は並べて表示。統合はしない） |
| `/about` | 非公式の説明、確認状態の説明 |

## ディレクトリ構成

```
data/
  types.ts        データ型（Entry / Confidence / SourceType）
  verified.ts     確認済みデータ（確認元URLあり）
  candidates.ts   調査候補データ（一次情報で未再検証）
  geo.ts          地方・都道府県マスタ（47都道府県）
lib/
  data.ts         データの唯一の入口（検証 → 画面用モデル構築）
  model.ts        都道府県→エリア→部門の組み立て、掲載状況の自動算出
  search.ts       全国横断検索・絞り込み
  text.ts         日本語検索用の正規化
  validate.ts     データ検証ルール
  links.ts        安全な外部リンク判定
  labels.ts       確認状態などの日本語表示
app/              画面（Next.js App Router）
components/       UI部品
tests/            テスト（tests/fixtures.ts はテスト専用の架空データ）
```

UI はすべて `lib/data.ts` の `site` を通してデータを参照します。どのファイルから来たデータかは `dataset` 項目で区別するだけで、UI が個別のデータファイルを直接読むことはありません。

## データ構造

1件の `Entry` は「確認元で見つかった1つの事実の単位」です（例: 「A県Bエリアの部門Cに出場者Dが店舗Eから出場している」）。

| 項目 | 必須 | 内容 |
| --- | --- | --- |
| `id` | ○ | 一意なID（英数字・`-`・`_`）。一度決めたら変えない |
| `prefecture` | | 都道府県の正式表記（例: `神奈川県`）。不明なら省略 |
| `area` | | エリア（確認元の表記どおり） |
| `categoryOriginal` | | 部門名。**確認元に掲載された原文をそのまま** |
| `categoryNormalized` | | 検索・比較の補助用。表示には使わない。根拠がある場合のみ |
| `entrantName` | | 出場者名 |
| `storeName` | | 店舗名 |
| `entrantUrl` / `storeUrl` / `sourceUrl` | | 本人・店舗・確認元のURL（http/https のみ） |
| `sourceType` | ○ | `official` / `store` / `entrant_diary` / `entrant_social` / `other` |
| `confidence` | ○ | `confirmed` / `probable` / `unverified` |
| `checkedAt` | | 確認日 `YYYY-MM-DD` |
| `notes` | | 補足 |

`prefecture` / `area` / `categoryOriginal` も省略できるようにしているのは、「部門だけ判明」「都道府県だけ判明」「店舗だけ判明」といった部分的な情報も登録できるようにするためです。ただし、どれも未入力の Entry は検証エラーになります。

### 「部門」の数え方

画面上の「部門」は **都道府県 × エリア × 部門名（原文）** の組み合わせです。部門数・部門名の種類・都道府県数などはすべてデータから自動で計算しており、固定値は持っていません（過去の「71部門」という整理にも依存していません）。

### 名称揺れの扱い

- `categoryOriginal` は確認元の表記のまま保持し、「美尻美脚」と「美尻・美脚」、「店長一押し」と「店長イチオシ」などを**統合しません**。
- 検索時だけ、記号・空白・全角半角・カタカナ/ひらがなの違いを無視します（`lib/text.ts`）。「美尻美脚」で検索すると「美尻・美脚」も見つかります。
- 漢字とカナの違い（一押し／イチオシ）など、正規化で吸収できない揺れは `categoryNormalized` で補助します。表示は原文のままです。
- 部門詳細ページでは「同じ部門名がある他の地域」（原文完全一致）と「表記が似ている部門」（同一とは確認していない）を分けて表示します。

## verified と candidate の違い

| | `data/verified.ts`（確認元あり） | `data/candidates.ts`（調査候補） |
| --- | --- | --- |
| 内容 | 確認元URLを実際に開いて確認したデータ | 過去調査で見つかった候補。一次情報で未再検証 |
| `sourceUrl` | 必須 | 任意（v0.1 の候補はすべてなし） |
| `checkedAt` | 必須 | 任意 |
| `confidence` | `confirmed` / `probable` | `probable` / `unverified`（`confirmed` は禁止） |
| 画面表示 | 「確認元あり」バッジ | 「調査候補」バッジ |

v0.1 時点では一次情報で確認できたデータがまだないため、`verified.ts` は空です。画面には「確認済みの情報はまだありません」と自動で注意表示されます。

## confidence（確認状態）の意味

| 値 | 画面表示 | 意味 |
| --- | --- | --- |
| `confirmed` | 確認済み | 公式・店舗・本人などの確認元で掲載を確認できた情報。`sourceUrl` 必須 |
| `probable` | 有力情報 | 強い根拠はあるが、確認が完全ではない情報 |
| `unverified` | 未確認 | 調査候補として保持しているだけの情報 |

`sourceUrl` のない情報は `confirmed` にできません（検証で弾きます）。

## 新しいデータの追加方法

1. 一次情報（公式・店舗・本人の掲載）を確認した → `data/verified.ts` の配列に追加
   まだ確認していない候補 → `data/candidates.ts` の `located` 配列などに追加
2. `categoryOriginal`・出場者名・店舗名は確認元の表記をそのまま書く
3. 分からない項目は**空文字にせず省略**する
4. `npm run validate:data` で検証 → `npm run build` で確認

追加するのはデータファイルだけです。都道府県ページ・エリアページ・部門ページ・検索・掲載状況・部門名一覧には自動で反映されます。UI コードの修正は不要です。

```ts
// data/verified.ts への追加例（値はすべて確認元どおりに書く）
{
  id: "kanagawa-0001",
  prefecture: "神奈川県",
  area: "（確認元の表記）",
  categoryOriginal: "（確認元の表記）",
  entrantName: "（確認元の表記）",
  storeName: "（確認元の表記）",
  sourceUrl: "https://（実際に確認したページ）",
  sourceType: "official",
  confidence: "confirmed",
  checkedAt: "2026-10-04",
},
```

検証ルール（`lib/validate.ts`）の主なもの: id の重複・形式、都道府県名の正式表記、URL は http/https のみ、日付形式、空文字禁止、candidate の confirmed 禁止、verified の sourceUrl・checkedAt 必須。エラーがあると **build が失敗** するため、壊れたデータは公開されません。

## 確認済みデータへ昇格する方法

1. `data/candidates.ts` の候補について、公式・店舗・本人のページで掲載を確認する
2. 確認できたら、その Entry を `candidates.ts` から**削除**し、`verified.ts` に移す
   - `sourceUrl`（実際に確認したURL）、`sourceType`、`checkedAt` を記入
   - `confidence` を `confirmed`（十分に確認できた）または `probable` にする
   - 部門名・人名・店舗名・エリアを確認元の表記に合わせて直す（候補時の表記が違っていた場合）
3. id はそのまま使ってかまいません（同じ id が両方に残っていると検証エラーになります）
4. 確認できなかった・誤りだった候補は、`notes` に経緯を書いて残すか削除する
5. `npm run check` で検証

## テスト

`npm test` で以下を検証します。

- 全国検索（都道府県・地方・エリア・部門・出場者・店舗、部分一致、AND検索、並び順）
- 都道府県フィルター／エリアフィルター／確認状態・区分フィルター
- 名称揺れ（記号・カナ・`categoryNormalized`、原文を変更しないこと）
- 部分データ（都道府県だけ・部門だけ・店舗だけ・出場者不明・sourceUrl なし）
- 空データ（0件でもモデル構築・検索・掲載状況が壊れない）
- データバリデーションと本番データの検査（candidate への confirmed 混入、URL 捏造、テスト用データ混入の検出など）
- 外部リンクの安全性判定

## 将来 GitHub / Vercel へ接続する際の考え方

- **GitHub**: このリポジトリをそのまま push すれば動きます。`node_modules` / `.next` は `.gitignore` 済み。データ追加は Pull Request で行い、CI（GitHub Actions）で `npm run check` を実行すると、検証エラーのあるデータがマージされるのを防げます。
- **Vercel**: リポジトリをインポートするだけでデプロイできます（Framework: Next.js、Build: `npm run build`、環境変数は不要）。全ページ静的生成なので、データ更新はデータファイルを変更して再デプロイするだけです。
- **データ更新の流れ（推奨）**: GPT等で調査 → 一次情報を確認 → `data/` を編集した PR → CI で検証 → マージ → Vercel が自動デプロイ。

## 将来拡張の入口

v0.1 では実装していませんが、次の拡張を妨げない構造にしています。

- **SVG日本地図**: `components/PrefecturePicker.tsx` を差し替える。`regionsWithPrefectures()` の結果（都道府県スラッグ・件数）と `data/geo.ts` の JIS コードをそのまま使える
- **データ自動取得・管理UI**: 出力を `Entry[]` に合わせれば `lib/data.ts` 以降はそのまま使える。データ量が増えたら `data/` を都道府県別ファイルや JSON に分割してもよい
- **新着情報・変更履歴**: `checkedAt` と Git の履歴を利用できる
- **お気に入り**: 部門ID（`/division/[id]`）は「都道府県・エリア・部門名」から決定的に生成されるため、データ追加でIDが変わらない
- **情報提供フォーム**: 受け付けた情報は candidate として登録する運用にする
