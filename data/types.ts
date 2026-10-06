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

/* ───────────── Phase 3：参加店舗（追加レイヤー） ───────────── */

/** participating_stores_2026.json の店舗（サイトで使うフィールドのみ型付け） */
export interface Phase3RawStore {
  storeId: string;
  storeName: string;
  storeNameOriginals: string[];
  prefecture: string | null;
  listingArea: string | null;
  listingAreas: string[];
  formalElectionArea: string | null;
  categoryOriginal: string | null;
  categoryOriginals: string[];
  participationEvidenceUrl: string | null;
  storePublicUrl: string | null;
  sourceType: string;
  confidence: string;
  participationType: string;
  checkedAt?: string | null;
  phase1RecordIds: string[];
  phase2RecordIds?: string[];
  isNewSincePhase1: boolean;
  sourceIds: string[];
  publicUrlAccessStatus?: string | null;
  notes?: string | null;
  fieldConfidence?: Record<string, string>;
  [key: string]: unknown;
}

export interface Phase3StoresFile {
  schemaVersion: string;
  summary: Record<string, number | null>;
  stores: Phase3RawStore[];
  [key: string]: unknown;
}

export interface Phase3RawRelation {
  relationId: string;
  storeId: string;
  categoryOriginal: string;
  categoryNormalized?: string | null;
  confidence: string;
  sourceIds: string[];
  phase1RecordIds: string[];
  notes?: string | null;
  [key: string]: unknown;
}

export interface Phase3RawSource {
  sourceId: string;
  url: string;
  sourceType: string;
  accessStatus: string;
  publisherRole: string;
  storeIds: string[];
  relationIds: string[];
  checkedAt?: string | null;
  notes?: string | null;
}

export interface Phase3CoveragePrefecture {
  prefecture: string;
  prefectureCode: string;
  status: string;
  storeCount: number;
  confirmedCount: number;
  probableCount: number;
  unverifiedCount: number;
  publicUrlCount: number;
  listingAreas: string[];
  divisionCount: number;
  [key: string]: unknown;
}

export interface Phase3Coverage {
  prefectures: Phase3CoveragePrefecture[];
  unassignedStoreCount: number;
}

export interface Phase3CampaignStore {
  storeId: string;
  storeName: string;
  prefecture: string | null;
  listingArea: string | null;
  participationEvidenceUrl: string | null;
  storePublicUrl: string | null;
  confidence: string;
  participationType: string;
  notes?: string | null;
}

/** Phase 2 の人数情報（countFacts） */
export interface Phase2CountFact {
  id: string;
  scope: string;
  participantCount: number | null;
  countType: string;
  sourceUrl?: string | null;
  sourceType?: string | null;
  confidence: string;
  prefecture?: string | null;
  groupName?: string | null;
  storeName?: string | null;
  notes?: string | null;
  [key: string]: unknown;
}

/** 画面が扱う店舗（Phase 3 storeId が主キー） */
export interface SiteStore {
  id: string;
  /**
   * データの出どころ
   * - phase3: Phase 3 成果物
   * - phase3b: Phase 3b 全国走査（検索結果からの発見。data/phase3b）
   * - update: 個別の差分更新（data/store-updates.ts）
   */
  origin: "phase3" | "phase3b" | "update";
  /** 確認方法（Phase 3b 以降。例: search_index_multiple） */
  verificationMethod?: string;
  /** 2026年の参加を示した店舗ページの数（検索結果で確認できた範囲） */
  evidencePageCount?: number;
  name: string;
  nameOriginals: string[];
  prefecture?: string;
  listingAreas: string[];
  formalElectionArea?: string;
  categoryOriginals: string[];
  /** 利用者が店舗を見るためのURL */
  storePublicUrl?: string;
  publicUrlAccessStatus?: string;
  /** 店舗と2026ミスヘブンの関係を確認する根拠URL */
  participationEvidenceUrl?: string;
  sourceType: SourceType;
  confidence: Confidence;
  participationType: string;
  isNewSincePhase1: boolean;
  phase1RecordIds: string[];
  sourceIds: string[];
  checkedAt?: string;
  notes?: string;
}

export interface SiteRelation {
  id: string;
  storeId: string;
  categoryOriginal: string;
  categoryNormalized?: string;
  confidence: Confidence;
  sourceIds: string[];
  phase1RecordIds: string[];
}

export interface SiteSource {
  id: string;
  url: string;
  sourceType: SourceType;
  accessStatus: string;
  publisherRole: string;
}

/** 店舗に結び付いた人数情報（Phase 2、確認済みで店舗名・県が完全一致したもののみ） */
export interface StoreCountFact {
  id: string;
  storeId: string;
  countType: string;
  participantCount: number;
  sourceUrl?: string;
  notes?: string;
}

export interface StoreLayer {
  stores: SiteStore[];
  relations: SiteRelation[];
  sources: SiteSource[];
  countFacts: StoreCountFact[];
  /** 出場者の記録（data/entrant-updates.ts）。Phase 1 の観測とは別に追加したもの */
  entrants?: SiteEntrantRecord[];
}

/**
 * 出場者の記録（入力形式。data/entrant-updates.ts）。
 *
 * 必須：人物名・所属店舗・2026年の出場を示す根拠（情報源と、そこに書かれていた内容）。
 * 任意：部門（その店舗の部門に限る）・個人のページURL。
 * 都道府県・掲載地域は店舗から表示する（ここには書かない・推測しない）。
 */
export interface EntrantRawRecord {
  /** 例: "mh26-ent-0001" */
  entrantId: string;
  /** 情報源の表記どおりの名前 */
  name: string;
  /** 所属店舗の storeId（Phase 3・Phase 3b・差分更新のいずれか） */
  storeId: string;
  /** 2026年の出場を示す情報源（store_sources / sourceUpdates の sourceId）。1件以上 */
  sourceIds: string[];
  /** 情報源に何が書かれていたか（2026年の出場を示す記載を短く。人物写真・全文は書かない） */
  evidence: string;
  /**
   * 根拠の記載の日付（YYYY-MM-DD）。evidence に「2026」の文字がない場合だけ必須。
   * 例：本人の「ミスヘブンへの意気込み」の投稿（10/2）で「今年出場します」とあり、年の表記がないもの
   */
  evidenceDate?: string | null;
  /** 部門（原文）。情報源で確認できた場合のみ。その店舗の部門（店舗×部門関係）にあるものに限る */
  categoryOriginal?: string | null;
  /** 本人のページURL（任意） */
  personalUrl?: string | null;
  confidence: string;
  checkedAt: string;
  notes?: string | null;
}

export interface SiteEntrantRecord {
  id: string;
  name: string;
  storeId: string;
  sourceIds: string[];
  evidence: string;
  evidenceDate?: string;
  categoryOriginal?: string;
  personalUrl?: string;
  confidence: Confidence;
  checkedAt: string;
  notes?: string;
}

/** Phase 3b 全国走査の都道府県別カバレッジ */
export interface Phase3bCoveragePrefecture {
  prefecture: string;
  prefSlug: string;
  /** searched = 予定した検索をすべて実行 / not_searched = 未実行・失敗あり */
  researchStatus: "searched" | "not_searched";
  queryCount: number;
  pageCount: number;
  resultCount: number;
  storesFound: number;
  newStores: number;
  matchedExisting: number;
  byConfidence: Record<string, number>;
  /** found = 店舗を発見 / insufficient = 検索したが店舗を特定できる根拠なし */
  dataStatus: "found" | "insufficient";
}
