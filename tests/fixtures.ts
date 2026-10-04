import type { Entry } from "@/data/types";

/**
 * テスト専用の架空データ。実在の人物・店舗・URLではない（example.com は予約ドメイン）。
 * 本番データ（data/）には絶対に混ぜない。
 */
export const fixtureVerified: Entry[] = [
  {
    id: "t-v-1",
    prefecture: "神奈川県",
    area: "テスト市",
    categoryOriginal: "美尻美脚",
    entrantName: "テスト出場者A",
    storeName: "テスト店舗X",
    entrantUrl: "https://example.com/entrant/a",
    storeUrl: "https://example.com/store/x",
    sourceUrl: "https://example.com/source/1",
    sourceType: "official",
    confidence: "confirmed",
    checkedAt: "2026-09-01",
  },
  {
    id: "t-v-2",
    prefecture: "神奈川県",
    area: "テスト市",
    categoryOriginal: "美尻美脚",
    entrantName: "テスト出場者B",
    sourceUrl: "https://example.com/source/2",
    sourceType: "store",
    confidence: "probable",
    checkedAt: "2026-09-15",
  },
  {
    id: "t-v-3",
    prefecture: "福岡県",
    area: "サンプル区",
    categoryOriginal: "店長イチオシ",
    categoryNormalized: "店長いちおし",
    entrantName: "テスト出場者C",
    storeName: "テスト店舗Y",
    sourceUrl: "https://example.com/source/3",
    sourceType: "entrant_diary",
    confidence: "confirmed",
    checkedAt: "2026-08-20",
  },
];

export const fixtureCandidates: Entry[] = [
  // 表記揺れ（美尻美脚 / 美尻・美脚）
  {
    id: "t-c-1",
    prefecture: "大阪府",
    categoryOriginal: "美尻・美脚",
    sourceType: "other",
    confidence: "unverified",
  },
  // 表記揺れ（店長一押し / 店長イチオシ）
  {
    id: "t-c-2",
    prefecture: "大阪府",
    area: "テスト北",
    categoryOriginal: "店長一押し",
    categoryNormalized: "店長いちおし",
    sourceType: "other",
    confidence: "unverified",
  },
  // 部門だけ判明
  { id: "t-c-3", categoryOriginal: "かわいいアイドル", sourceType: "other", confidence: "unverified" },
  { id: "t-c-4", categoryOriginal: "アイドル・可愛い", sourceType: "other", confidence: "unverified" },
  // 都道府県だけ判明
  { id: "t-c-5", prefecture: "北海道", sourceType: "other", confidence: "unverified" },
  // 店舗だけ判明（部門・出場者不明）
  {
    id: "t-c-6",
    prefecture: "静岡県",
    storeName: "テスト店舗Z",
    sourceType: "other",
    confidence: "unverified",
  },
  // 出場者は判明・店舗不明・sourceUrlなし・probable
  {
    id: "t-c-7",
    prefecture: "神奈川県",
    area: "テスト市",
    categoryOriginal: "コスプレ",
    entrantName: "テスト出場者D",
    sourceType: "entrant_social",
    confidence: "probable",
  },
];

export const fixtureSets = { verified: fixtureVerified, candidate: fixtureCandidates };
