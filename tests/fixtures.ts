import type { Phase2CountFact, Phase1RawRecord, Phase3RawRelation, Phase3RawSource, Phase3RawStore } from "@/data/types";
import { adaptAll } from "@/lib/phase1";
import { adaptStoreLayer } from "@/lib/phase3";
import { buildModel } from "@/lib/model";

/**
 * テスト専用の架空データ（Phase 1 JSON と同じ形）。実在の人物・店舗・URLではない。
 * example.com は予約ドメイン。本番データ（data/）には混ぜない。
 */
const base = {
  categoryNormalized: null,
  storeName: null,
  entrantName: null,
  entrantNames: [],
  entrantUrl: null,
  storeUrl: null,
  regionSourceUrl: null,
  formalElectionArea: null,
  checkedAt: "2026-09-01",
  notes: null,
};

export const rawRecords: Phase1RawRecord[] = [
  {
    ...base,
    id: "t-1",
    prefecture: "神奈川県",
    area: "テスト市",
    listingArea: "テスト市",
    categoryOriginal: "美尻美脚部門",
    storeName: "テスト店舗X",
    entrantName: "テスト出場者A",
    entrantNames: ["テスト出場者A"],
    entrantUrl: "https://example.com/entrant/a",
    sourceUrl: "https://example.com/source/1",
    regionSourceUrl: "https://example.com/region/1",
    sourceType: "entrant_diary",
    regionSourceType: "store",
    confidence: "confirmed",
    categoryConfidence: "confirmed",
    regionConfidence: "confirmed",
    checkedAt: "2026-10-05T02:20:25+00:00",
  },
  {
    ...base,
    id: "t-2",
    prefecture: "神奈川県",
    area: "テスト市",
    listingArea: "テスト市",
    categoryOriginal: "美尻美脚部門",
    storeName: "テスト店舗X",
    entrantNames: ["テスト出場者B", "テスト出場者C"],
    sourceUrl: "https://example.com/source/2",
    sourceType: "store",
    confidence: "probable",
  },
  // 表記揺れ（記号）
  {
    ...base,
    id: "t-3",
    prefecture: "大阪府",
    area: null,
    listingArea: null,
    categoryOriginal: "美尻・美脚部門",
    sourceUrl: "https://example.com/source/3",
    sourceType: "other",
    confidence: "unverified",
  },
  // 表記揺れ（絵文字。categoryNormalized は検索補助のみ）
  {
    ...base,
    id: "t-4",
    prefecture: "大阪府",
    area: "テスト北",
    listingArea: "テスト北",
    categoryOriginal: "コスプレ部門🎀",
    categoryNormalized: "コスプレ部門",
    storeName: "テスト店舗Y",
    entrantName: "テスト出場者D",
    sourceUrl: "https://example.com/source/4",
    sourceType: "store",
    confidence: "unverified",
  },
  // 都道府県未判明・掲載地域あり（地名から県を推定しない）
  {
    ...base,
    id: "t-5",
    prefecture: null,
    area: "テスト駅前",
    listingArea: "テスト駅前",
    categoryOriginal: "かわいいアイドル部門",
    sourceUrl: "https://example.com/source/5",
    sourceType: "other",
    confidence: "unverified",
  },
  // 都道府県・掲載地域とも未判明、部門だけ判明（部分データ）
  {
    ...base,
    id: "t-6",
    prefecture: null,
    area: null,
    listingArea: null,
    categoryOriginal: "アイドル・可愛い部門",
    sourceUrl: "https://example.com/source/6",
    sourceType: "other",
    confidence: "unverified",
    checkedAt: null,
  },
  // 店舗・出場者不明の候補（県だけ判明）
  {
    ...base,
    id: "t-7",
    prefecture: "福岡県",
    area: null,
    listingArea: null,
    categoryOriginal: "テスト部門",
    sourceUrl: "https://example.com/source/7",
    sourceType: "other",
    confidence: "probable",
  },
];

/** Phase 3 と同じ形の架空の店舗データ */
const storeBase = {
  formalElectionArea: null,
  categoryOriginal: null,
  categoryOriginals: [] as string[],
  participationEvidenceUrl: null,
  storePublicUrl: null,
  sourceType: "store",
  confidence: "unverified",
  participationType: "baseline_observation",
  phase1RecordIds: [] as string[],
  isNewSincePhase1: false,
  sourceIds: [] as string[],
  publicUrlAccessStatus: "unknown",
  notes: null,
};

export const rawStores: Phase3RawStore[] = [
  {
    ...storeBase,
    storeId: "t-store-x",
    storeName: "テスト店舗X",
    storeNameOriginals: ["テスト店舗X", "テスト店舗 X"],
    prefecture: "神奈川県",
    listingArea: "テスト市",
    listingAreas: ["テスト市"],
    categoryOriginal: "美尻美脚部門",
    categoryOriginals: ["美尻美脚部門"],
    participationEvidenceUrl: "https://example.com/source/1",
    storePublicUrl: "https://example.com/store/x",
    sourceType: "entrant_diary",
    confidence: "confirmed",
    phase1RecordIds: ["t-1", "t-2"],
    sourceIds: ["t-src-1", "t-src-2"],
    publicUrlAccessStatus: "inherited_not_rechecked",
  },
  {
    ...storeBase,
    storeId: "t-store-y",
    storeName: "テスト店舗Y",
    storeNameOriginals: ["テスト店舗Y"],
    prefecture: "大阪府",
    listingArea: "テスト北",
    listingAreas: ["テスト北"],
    categoryOriginal: "コスプレ部門🎀",
    categoryOriginals: ["コスプレ部門🎀"],
    participationEvidenceUrl: "https://example.com/source/4",
    confidence: "unverified",
    phase1RecordIds: ["t-4"],
    sourceIds: ["t-src-4"],
  },
  // 部門未確認・観測なしの新規店舗（県は愛媛県 → 地図の状態が confirmed になる）
  {
    ...storeBase,
    storeId: "t-store-new",
    storeName: "テスト新店舗",
    storeNameOriginals: ["テスト新店舗"],
    prefecture: "愛媛県",
    listingArea: "テスト温泉",
    listingAreas: ["テスト温泉"],
    participationEvidenceUrl: "https://example.com/event",
    storePublicUrl: "https://example.com/store/new",
    sourceType: "official",
    confidence: "confirmed",
    participationType: "entry_reported",
    isNewSincePhase1: true,
    sourceIds: ["t-src-5"],
    publicUrlAccessStatus: "primary_body_checked",
  },
  // 県不明の店舗（地図へ割り当てない）
  {
    ...storeBase,
    storeId: "t-store-unknown",
    storeName: "テスト県不明店",
    storeNameOriginals: ["テスト県不明店"],
    prefecture: null,
    listingArea: null,
    listingAreas: [],
    participationEvidenceUrl: "https://example.com/source/9",
    sourceType: "other",
    confidence: "unverified",
    participationType: "candidate",
    isNewSincePhase1: true,
  },
];

export const rawRelations: Phase3RawRelation[] = [
  {
    relationId: "t-rel-1",
    storeId: "t-store-x",
    categoryOriginal: "美尻美脚部門",
    categoryNormalized: null,
    confidence: "confirmed",
    sourceIds: ["t-src-1"],
    phase1RecordIds: ["t-1", "t-2"],
  },
  {
    relationId: "t-rel-2",
    storeId: "t-store-y",
    categoryOriginal: "コスプレ部門🎀",
    categoryNormalized: "コスプレ部門",
    confidence: "unverified",
    sourceIds: ["t-src-4"],
    phase1RecordIds: ["t-4"],
  },
];

export const rawSources: Phase3RawSource[] = [
  { sourceId: "t-src-1", url: "https://example.com/source/1", sourceType: "entrant_diary", accessStatus: "inherited_not_rechecked", publisherRole: "business_evidence", storeIds: ["t-store-x"], relationIds: ["t-rel-1"] },
  { sourceId: "t-src-2", url: "https://example.com/store/x", sourceType: "store", accessStatus: "inherited_not_rechecked", publisherRole: "store_public_page", storeIds: ["t-store-x"], relationIds: [] },
  { sourceId: "t-src-4", url: "https://example.com/source/4", sourceType: "store", accessStatus: "primary_body_checked", publisherRole: "business_evidence", storeIds: ["t-store-y"], relationIds: ["t-rel-2"] },
  { sourceId: "t-src-5", url: "https://example.com/event", sourceType: "official", accessStatus: "primary_body_checked", publisherRole: "store_announcement", storeIds: ["t-store-new"], relationIds: [] },
];

export const rawCountFacts: Phase2CountFact[] = [
  { id: "t-count-1", scope: "store", participantCount: 5, countType: "declared_web_application_count", confidence: "confirmed", prefecture: "神奈川県", storeName: "テスト店舗 X", sourceUrl: "https://example.com/apply" },
  // 未確認・人数不明・一致しないものは店舗に結び付けない
  { id: "t-count-2", scope: "store", participantCount: 40, countType: "indexed_store_claim", confidence: "unverified", prefecture: "大阪府", storeName: "テスト店舗Y" },
  { id: "t-count-3", scope: "store", participantCount: null, countType: "unknown", confidence: "confirmed", prefecture: "大阪府", storeName: "テスト店舗Y" },
  { id: "t-count-4", scope: "store", participantCount: 3, countType: "declared_web_application_count", confidence: "confirmed", prefecture: "東京都", storeName: "テスト店舗X" },
  { id: "t-count-5", scope: "national", participantCount: 10000, countType: "official_approximate_participation_scale", confidence: "confirmed" },
];

export const records = adaptAll({ phase1: rawRecords, update: [] });
export const layer = adaptStoreLayer({ stores: rawStores, relations: rawRelations, sources: rawSources, countFacts: rawCountFacts });
/** Phase 1 観測のみのモデル */
export const model = buildModel(records);
/** Phase 1 観測 ＋ Phase 3 店舗のモデル */
export const modelWithStores = buildModel(records, { layer });
