import type { Entry } from "./types";

/**
 * 確認済みデータ（verified）。
 *
 * 確認元（sourceUrl）を実際に開いて内容を確認したデータだけをここに登録する。
 *
 * ルール（lib/validate.ts で自動検証される）:
 * - sourceUrl は必須（http/https）。推測でURLを作らない
 * - confidence は "confirmed" または "probable"
 * - checkedAt（確認日 YYYY-MM-DD）を必ず記入する
 * - categoryOriginal は確認元に掲載された原文どおりに書く（表記を整えない）
 *
 * 記入例（コメント。実在データではない）:
 * {
 *   id: "kanagawa-kawasaki-0001",
 *   prefecture: "神奈川県",
 *   area: "（確認元の表記どおり）",
 *   categoryOriginal: "（確認元の表記どおり）",
 *   entrantName: "（確認元の表記どおり）",
 *   storeName: "（確認元の表記どおり）",
 *   sourceUrl: "https://（実際に確認したページのURL）",
 *   sourceType: "official",
 *   confidence: "confirmed",
 *   checkedAt: "2026-10-04",
 * },
 *
 * v0.1 時点では一次情報での確認が済んだデータはまだないため空。
 */
export const verified: readonly Entry[] = [];
