/**
 * データ型定義。
 *
 * 基準データは Phase 1 最終成果物（data/phase1/*.json）。JSON は受け取ったまま変更せず、
 * lib/phase1.ts のアダプターで画面用の SiteRecord に変換する。
 */

/** 観測の確認状態（地域×部門の接続についての総合判定） */
export type Confidence = "confirmed" | "probable" | "unverified";

/** 確認元の種類 */
export type SourceType = "official" | "store" | "entrant_diary" | "entrant_social" | "other";

/** 地図上の都道府県の調査状態 */
export type MapStatus = "confirmed" | "candidate" | "searched_no_evidence";

/** データの出どころ */
export type Dataset =
  | "phase1" // Phase 1 最終データ（data/phase1/nationwide_dataset_v1.json）
  | "update"; // Phase 1 以降の差分更新（data/updates.ts）

/**
 * Phase 1 JSON のレコード（サイトで使うフィールドのみ型付け）。
 * 他のフィールド（調査経緯など）も JSON にはそのまま残っている。
 * data/updates.ts の差分レコードも同じ形で書く。
 */
export interface Phase1RawRecord {
  id: string;
  prefecture: string | null;
  /** v0.1互換のフィールド。Phase 1 では listingArea と同値 */
  area?: string | null;
  listingArea?: string | null;
  formalElectionArea?: string | null;
  categoryOriginal: string;
  categoryNormalized?: string | null;
  storeName?: string | null;
  entrantName?: string | null;
  entrantNames?: string[] | null;
  entrantUrl?: string | null;
  storeUrl?: string | null;
  sourceUrl?: string | null;
  sourceType: string;
  regionSourceUrl?: string | null;
  regionSourceType?: string | null;
  confidence: string;
  categoryConfidence?: string | null;
  regionConfidence?: string | null;
  checkedAt?: string | null;
  notes?: string | null;
  storePrefecture?: string | null;
  storeCity?: string | null;
  sourceAccessStatus?: string | null;
  [key: string]: unknown;
}

export interface Phase1Dataset {
  schemaVersion: string;
  event: string;
  datasetVersion: string;
  frozenAt: string;
  summary: Record<string, number>;
  scope: string;
  records: Phase1RawRecord[];
  [key: string]: unknown;
}

export interface Phase1MapPrefecture {
  prefecture: string;
  /** JIS都道府県コード（2桁文字列） */
  prefectureCode: string;
  status: string;
  recordCount: number;
  divisionCount: number;
  confirmedCount: number;
  probableCount: number;
  unverifiedCount: number;
  listingAreas: string[];
  listingAreaCount: number;
  storeCount: number;
  entrantCount: number;
  unknownListingAreaRecordCount: number;
  lastChecked: string;
  lastReviewed: string;
  unresolved: string;
}

export interface Phase1Map {
  schemaVersion: string;
  unassignedRecordCount: number;
  prefectures: Phase1MapPrefecture[];
  [key: string]: unknown;
}

/** 画面が扱うレコード。null は省略（undefined）に変換済み。文字列の内容は変更しない */
export interface SiteRecord {
  id: string;
  dataset: Dataset;
  /** 掲載店舗・地域と部門観測を接続する都道府県。不明なら undefined（地名から推定しない） */
  prefecture?: string;
  /** 情報源に書かれた掲載・営業地域。サイトの地域階層に使う */
  listingArea?: string;
  /** 正式選挙エリア。未確認なら undefined（推測で埋めない） */
  formalElectionArea?: string;
  /** 掲載原文の部門名（表示上の正式名称） */
  categoryOriginal: string;
  /** 検索補助のみ */
  categoryNormalized?: string;
  storeName?: string;
  /** 出場者名（原文）。entrantNames、なければ entrantName */
  entrantNames: string[];
  entrantUrl?: string;
  storeUrl?: string;
  /** 部門の根拠 */
  sourceUrl?: string;
  sourceType: SourceType;
  /** 地域の根拠 */
  regionSourceUrl?: string;
  regionSourceType?: SourceType;
  confidence: Confidence;
  categoryConfidence?: Confidence;
  regionConfidence?: Confidence;
  checkedAt?: string;
  notes?: string;
  storePrefecture?: string;
  storeCity?: string;
  sourceAccessStatus?: string;
}
