import pilot3 from "./stores/pilot3-2026-10-06.json";
import national from "./stores/national-2026-10-06.json";
import finishing from "./stores/finishing-2026-10-06.json";
import type { Phase3RawRelation, Phase3RawSource, Phase3RawStore, StoreListingAreaUpdate, StorePublicUrlUpdate } from "./types";

/** 3都道府県パイロット（大阪府・宮城県・青森県、2026-10-06）の追加分 */
const pilot3Batch = pilot3 as unknown as {
  stores: Phase3RawStore[];
  relations: Phase3RawRelation[];
  sources: Phase3RawSource[];
  listingAreaUpdates: StoreListingAreaUpdate[];
};

/** 仕上げPhase（2026-10-06）の追加分（店名を確認できた店舗の救済、東京・大阪の続き、エリア分割検索）。形は全国展開と同じ */
const finishingBatch = finishing as unknown as {
  stores: Phase3RawStore[];
  relations: Phase3RawRelation[];
  sources: Phase3RawSource[];
  listingAreaUpdates: StoreListingAreaUpdate[];
  publicUrlUpdates: StorePublicUrlUpdate[];
};

/** 全国展開（2026-10-06）の追加分。既存店舗の掲載地域・公開ページURLの補完を含む */
const nationalBatch = national as unknown as {
  stores: Phase3RawStore[];
  relations: Phase3RawRelation[];
  sources: Phase3RawSource[];
  listingAreaUpdates: StoreListingAreaUpdate[];
  publicUrlUpdates: StorePublicUrlUpdate[];
};

/**
 * Phase 3 以降に追加する参加関連店舗（差分更新）。
 *
 * Phase 3 の成果物（data/phase3/*.json）は凍結済みなので直接編集しない。
 * 新しく確認できた店舗は、Phase 3 と同じ形でここに追加する。
 *
 * - storeId は Phase 3 と重複しないもの（例: "mh26-upd-store-0001"）
 * - 店名・部門名は情報源の表記どおり。不明な項目は null（推測で埋めない）
 * - formalElectionArea は正式に確認できた場合のみ。店舗所在地から作らない
 * - confidence は根拠の強さに応じて決める。URL があるだけで confirmed にしない
 * - 人物名はここには書かない。出場者は data/entrant-updates.ts に記録する
 * - 画像（宣材・告知バナー）は保存しない。リンクと必要最小限の事実だけを書く
 */

const manualStores: Phase3RawStore[] = [
  {
    storeId: "mh26-upd-store-0001",
    storeName: "abc＋",
    storeNameOriginals: ["abc＋", "abc＋（エービーシープラス）"],
    prefecture: "神奈川県",
    listingArea: "厚木",
    listingAreas: ["厚木"],
    formalElectionArea: null,
    categoryOriginal: "デリヘル部門",
    categoryOriginals: ["デリヘル部門"],
    participationEvidenceUrl: "https://www.cityheaven.net/kanagawa/A1406/A140602/abc/?lo=1",
    storePublicUrl: "https://www.cityheaven.net/kanagawa/A1406/A140602/abc/?lo=1",
    sourceType: "store",
    confidence: "probable",
    participationType: "store_banner_reported",
    checkedAt: "2026-10-05",
    phase1RecordIds: [],
    phase2RecordIds: [],
    isNewSincePhase1: true,
    sourceIds: ["upd-src-0001"],
    publicUrlAccessStatus: "unknown",
    notes:
      "利用者からの情報提供（2026-10-05）。ヘブン掲載の店舗ページ上部の告知バナーに「全国ミスヘブン総選挙2026」「デリヘル部門」「ゆず」「NOMINATION」「地方予選 投票開始 10.28(水) 12:00〜」の表記があることを、利用者提供のスクリーンショットで確認。店舗ページの表記は「デリヘル(スタンダード/厚木)」。調査環境からは当該サイトにアクセスできず、本文の直接確認はしていないため probable。大会運営による一覧での確認ではない。正式選挙エリアは未確認。",
  },
  // ── 本人申請を起点に追加（2026-10-06）。店舗の公開ページURL・掲載地域は提供されておらず、推測していないため空欄 ──
  {
    storeId: "mh26-upd-store-0002",
    storeName: "AMOR-アモル-",
    storeNameOriginals: ["AMOR-アモル-"],
    prefecture: "福岡県",
    listingArea: null,
    listingAreas: [],
    formalElectionArea: null,
    categoryOriginal: null,
    categoryOriginals: [],
    participationEvidenceUrl: "https://x.com/princess1224mei",
    storePublicUrl: null,
    sourceType: "entrant_social",
    confidence: "unverified",
    participationType: "entrant_self_reported",
    checkedAt: "2026-10-06",
    phase1RecordIds: [],
    phase2RecordIds: [],
    isNewSincePhase1: true,
    sourceIds: ["upd-src-0003"],
    publicUrlAccessStatus: "unknown",
    notes:
      "本人申請を起点に追加（2026-10-06）。所属する出場者（恋仲めい）本人から掲載希望があり、本人Xの2026年10月6日の投稿で出場表明を確認。店舗自身の告知は確認していないため unverified。店舗の公開ページURL・掲載地域は未確認（推測しない）。正式選挙エリアは未確認。",
  },
];

const manualRelations: Phase3RawRelation[] = [
  {
    relationId: "upd-rel-0001",
    storeId: "mh26-upd-store-0001",
    categoryOriginal: "デリヘル部門",
    categoryNormalized: null,
    confidence: "probable",
    sourceIds: ["upd-src-0001"],
    phase1RecordIds: [],
    notes: "告知バナーの部門表記。店舗の全員がこの部門という意味ではない（バナーの出場者は data/entrant-updates.ts）。",
  },
];

const manualSources: Phase3RawSource[] = [
  {
    sourceId: "upd-src-0001",
    url: "https://www.cityheaven.net/kanagawa/A1406/A140602/abc/?lo=1",
    sourceType: "store",
    accessStatus: "user_screenshot_only",
    publisherRole: "store_announcement",
    storeIds: ["mh26-upd-store-0001"],
    relationIds: ["upd-rel-0001"],
    checkedAt: "2026-10-05",
    notes: "利用者提供のスクリーンショットで店舗告知バナーを確認。画像は保存していない。",
  },
  {
    sourceId: "upd-src-0002",
    url: "https://www.cityheaven.net/kanagawa/A1401/A140103/onemorecoming/",
    sourceType: "store",
    accessStatus: "search_index_only",
    publisherRole: "store_public_page",
    storeIds: ["mh26-store-b33dc19606e7c823"],
    relationIds: [],
    checkedAt: "2026-10-05",
    notes:
      "Phase 3b 全国走査で、ヘブンの店舗ページ（店舗キー kanagawa/A1401/A140103/onemorecoming、店名「One More 奥様 横浜関内店」）が既存の店舗と同一と照合済み（data/phase3b/research_log.json の matchedExisting）。ページ本文は調査環境から取得していない。",
  },
  {
    sourceId: "upd-src-0003",
    url: "https://x.com/princess1224mei",
    sourceType: "entrant_social",
    accessStatus: "user_reported_only",
    publisherRole: "entrant_social_post",
    storeIds: ["mh26-upd-store-0002"],
    relationIds: [],
    checkedAt: "2026-10-06",
    notes: "所属する出場者本人のXアカウント。2026年10月6日の本人の出場表明（本人申請の内容）による。本人申請を起点に追加",
  },
];

export const storeUpdates: Phase3RawStore[] = [...manualStores, ...pilot3Batch.stores, ...nationalBatch.stores, ...finishingBatch.stores];
export const relationUpdates: Phase3RawRelation[] = [...manualRelations, ...pilot3Batch.relations, ...nationalBatch.relations, ...finishingBatch.relations];
export const sourceUpdates: Phase3RawSource[] = [...manualSources, ...pilot3Batch.sources, ...nationalBatch.sources, ...finishingBatch.sources];

/**
 * 既存店舗の店舗公開ページURLの補完。元の店舗データ（Phase 3 など）にURLがなく、
 * 保存済みの証拠から確実に特定できた場合だけ追加する（推測したURLは入れない）。
 */
const manualPublicUrlUpdates: StorePublicUrlUpdate[] = [
  {
    storeId: "mh26-store-b33dc19606e7c823",
    storePublicUrl: "https://www.cityheaven.net/kanagawa/A1401/A140103/onemorecoming/",
    sourceIds: ["upd-src-0002"],
    notes: "One More 奥様 横浜関内店。Phase 3b の照合記録による。",
  },
];

export const storePublicUrlUpdates: StorePublicUrlUpdate[] = [...manualPublicUrlUpdates, ...nationalBatch.publicUrlUpdates, ...finishingBatch.publicUrlUpdates];

/**
 * 既存店舗の掲載地域の補完。元の店舗データに掲載地域がなく、店舗キー・店名が一致するページの
 * 掲載地域表記から確実に特定できた場合だけ追加する（推測しない。正式選挙エリアとは別）。
 */
export const storeListingAreaUpdates: StoreListingAreaUpdate[] = [...pilot3Batch.listingAreaUpdates, ...nationalBatch.listingAreaUpdates, ...finishingBatch.listingAreaUpdates];
