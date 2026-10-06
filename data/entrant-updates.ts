import type { EntrantRawRecord } from "./types";

/**
 * 出場者の記録（Phase 1 の観測とは別に追加する出場者）。
 *
 * 記録できる条件（すべて必須）
 * - 人物名（情報源の表記どおり）
 * - 所属店舗（既存の storeId。店舗がなければ先に店舗を追加する）
 * - 2026年の出場を示す根拠：情報源（sourceIds）と、そこに書かれていた内容（evidence）
 *   例：店舗の2026告知、店舗ページ、公開された告知画像、検索結果の具体的な2026出場の記述
 *
 * 記録しないもの
 * - 一般的な店舗紹介・単なる在籍情報・2025年以前の情報
 * - 名前が一致するだけのもの、店舗がミスヘブンに触れているだけのもの
 *
 * 任意
 * - categoryOriginal：情報源で部門が確認できた場合のみ。その店舗の部門（店舗×部門関係）にあるもの
 * - personalUrl：本人のページURL。なくても記録できる
 *
 * 都道府県・掲載地域は店舗から表示する（ここには書かない・推測しない）。
 * 個人の写真・プロフィール本文は保存しない。詳しくは店舗の公開ページで確認してもらう。
 */
export const entrantUpdates: EntrantRawRecord[] = [
  {
    entrantId: "mh26-ent-0001",
    name: "ゆず",
    storeId: "mh26-upd-store-0001",
    sourceIds: ["upd-src-0001"],
    evidence: "店舗ページ上部の告知バナー「全国ミスヘブン総選挙2026」に「デリヘル部門」「ゆず」「NOMINATION」と表記（利用者提供のスクリーンショットで確認）",
    categoryOriginal: "デリヘル部門",
    personalUrl: null,
    confidence: "probable",
    checkedAt: "2026-10-05",
    notes: "abc＋ の参加根拠と同じ告知バナー。調査環境からは店舗ページ本文を直接確認していない。",
  },
];
