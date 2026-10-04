/**
 * データ型定義。
 *
 * 1件の Entry は「確認元で見つかった1つの事実の単位」を表す。
 * 例: 「A県Bエリアの部門Cに出場者Dが店舗Eから出場している」
 *
 * 情報が部分的にしか判明していない場合（部門名だけ・都道府県だけ・店舗だけ等）でも
 * 1件として登録できるよう、prefecture / area / categoryOriginal は省略可能にしている。
 * ただし「何も判明していない」Entry は検証で弾く（lib/validate.ts）。
 */

/** 確認状態 */
export type Confidence = "confirmed" | "probable" | "unverified";

/** 確認元の種類 */
export type SourceType =
  | "official" // 公式サイト・公式発表
  | "store" // 店舗サイト・店舗の告知
  | "entrant_diary" // 出場者本人の写メ日記等
  | "entrant_social" // 出場者本人のSNS
  | "other"; // その他（過去調査メモ等を含む）

/** データファイル上の1件 */
export interface Entry {
  /** 一意なID（英数字・ハイフン・アンダースコアのみ）。URLにも使うため一度決めたら変えない */
  id: string;
  /** 都道府県（「神奈川県」「東京都」のような正式表記）。不明なら省略 */
  prefecture?: string;
  /** エリア（確認元の表記どおり）。不明なら省略 */
  area?: string;
  /** 部門名。確認元に掲載された原文をそのまま保持する（表記揺れを勝手に統合しない） */
  categoryOriginal?: string;
  /** 検索・比較補助用の正規化名。表示には使わない。根拠がある場合のみ設定する */
  categoryNormalized?: string;
  /** 出場者名（確認元の表記どおり） */
  entrantName?: string;
  /** 店舗名（確認元の表記どおり） */
  storeName?: string;
  /** 出場者本人のページURL */
  entrantUrl?: string;
  /** 店舗ページURL */
  storeUrl?: string;
  /** 確認元URL */
  sourceUrl?: string;
  sourceType: SourceType;
  confidence: Confidence;
  /** 確認日（YYYY-MM-DD） */
  checkedAt?: string;
  notes?: string;
}

/**
 * データセットの区分。
 * - verified : 確認元（sourceUrl）付きで登録したデータ（data/verified.ts）
 * - candidate: 調査候補。一次情報で未再検証のもの（data/candidates.ts）
 */
export type Dataset = "verified" | "candidate";

/** UI が扱うレコード（Entry に区分を付与したもの） */
export interface DataRecord extends Entry {
  dataset: Dataset;
}
