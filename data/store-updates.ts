import type { Phase3RawRelation, Phase3RawSource, Phase3RawStore } from "./types";

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
 * - 人物名は追加しない（店舗・部門の構造だけを記録する）
 * - 画像（宣材・告知バナー）は保存しない。リンクと必要最小限の事実だけを書く
 */

export const storeUpdates: Phase3RawStore[] = [
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
      "利用者からの情報提供（2026-10-05）。ヘブン掲載の店舗ページ上部の告知バナーに「全国ミスヘブン総選挙2026」「デリヘル部門」「NOMINATION」「地方予選 投票開始 10.28(水) 12:00〜」の表記があることを、利用者提供のスクリーンショットで確認。店舗ページの表記は「デリヘル(スタンダード/厚木)」。調査環境からは当該サイトにアクセスできず、本文の直接確認はしていないため probable。大会運営による一覧での確認ではない。正式選挙エリアは未確認。",
  },
];

export const relationUpdates: Phase3RawRelation[] = [
  {
    relationId: "upd-rel-0001",
    storeId: "mh26-upd-store-0001",
    categoryOriginal: "デリヘル部門",
    categoryNormalized: null,
    confidence: "probable",
    sourceIds: ["upd-src-0001"],
    phase1RecordIds: [],
    notes: "告知バナーの部門表記。店舗の全員がこの部門という意味ではない。",
  },
];

export const sourceUpdates: Phase3RawSource[] = [
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
];
