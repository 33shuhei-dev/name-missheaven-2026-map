import type { Phase1RawRecord } from "@/data/types";
import { adaptAll } from "@/lib/phase1";
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

export const records = adaptAll({ phase1: rawRecords, update: [] });
export const model = buildModel(records);
