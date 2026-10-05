import type { Phase1RawRecord } from "./types";

/**
 * Phase 1 以降の差分更新（追加・訂正）。
 *
 * Phase 1 データ（data/phase1/*.json）は凍結済みの基準データなので直接編集しない。
 * 新しく公開された具体的な情報に基づく追加は、ここに Phase 1 と同じ形で書く。
 *
 * - id は Phase 1 と重複しないもの（例: "mh26-upd-0001"）
 * - categoryOriginal・店舗名・出場者名は情報源の表記どおり
 * - 不明な項目は null（空文字・推測で埋めない）
 * - formalElectionArea は正式に確認できた場合のみ。店舗所在地から作らない
 * - confirmed は sourceUrl 必須
 *
 * 記入例（コメント。実在データではない）:
 * {
 *   id: "mh26-upd-0001",
 *   prefecture: "（都道府県の正式表記 または null）",
 *   listingArea: "（情報源の掲載地域 または null）",
 *   formalElectionArea: null,
 *   categoryOriginal: "（掲載原文）",
 *   storeName: null,
 *   entrantNames: [],
 *   sourceUrl: "https://（確認したページ）",
 *   sourceType: "store",
 *   confidence: "probable",
 *   checkedAt: "2026-10-05",
 *   notes: "（根拠・留保）",
 * },
 */
export const updates: Phase1RawRecord[] = [];
