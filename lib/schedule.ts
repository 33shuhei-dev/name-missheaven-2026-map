/**
 * 大会の日程（2026）。出典：ヘブンネット運営の媒体ニュース「ヘブンnavi」の記事
 * 「【2026/10/28投票開始】全国ミスヘブン総選挙2026地方予選が開催」（2026-09-28 公開）の本文の表記どおり。
 * 時刻は日本時間。記事にない日程は推測しない。
 * 地方予選の期間（10/28 12:00〜11/3 23:59）とグランプリ発表日（12/19）は、ヘブンの特設ページ「ミスヘブン2026」の
 * 表示（2026-10-31 に利用者のスクリーンショットで確認）による。記事の「11/4 12:00」とは異なるため、特設ページの表記を優先した。
 */
export const SCHEDULE_SOURCE = {
  url: "https://link-f.biz/archives/25134",
  label: "ヘブンnaviの記事（地方予選の案内）",
};
/** 地方予選の期間・グランプリ発表日の出典（URLなし：利用者のスクリーンショットで確認したもの） */
export const SCHEDULE_OFFICIAL_NOTE = "地方予選の期間とグランプリ発表日は、ヘブンの特設ページ「ミスヘブン2026」の表示（2026年10月31日確認）による";

export type SchedulePhase = { id: "local" | "block"; name: string; start: string; end: string; startLabel: string; endLabel: string };

export const SCHEDULE: SchedulePhase[] = [
  {
    id: "local",
    name: "地方予選（投票）",
    start: "2026-10-28T12:00:00+09:00",
    end: "2026-11-03T23:59:59+09:00",
    startLabel: "10/28(水) 12:00",
    endLabel: "11/3(火) 23:59",
  },
  {
    id: "block",
    name: "ブロック本選（投票）",
    start: "2026-11-17T12:00:00+09:00",
    end: "2026-11-24T12:00:00+09:00",
    startLabel: "11/17(火) 12:00",
    endLabel: "11/24(火) 12:00",
  },
];

/** ブロック本選への進出条件（記事の表記どおり） */
export const BLOCK_CONDITION = "地方予選で、50人のユーザーから投票されること";
/** グランプリ発表（ヘブンの特設ページの告知動画の表記） */
export const GRANDPRIX_NOTE = "グランプリ発表は12/19（ヘブンの特設ページの告知の表記。時刻は未確認）";

/** 現在の時点の状況を一文で返す（日程の外の推測はしない） */
export function currentStatus(now: Date): { phaseId: SchedulePhase["id"] | null; text: string } {
  const t = now.getTime();
  const [local, block] = SCHEDULE;
  const s = (p: SchedulePhase) => new Date(p.start).getTime();
  const e = (p: SchedulePhase) => new Date(p.end).getTime();
  if (t < s(local)) return { phaseId: null, text: `まもなく地方予選の投票開始（${local.startLabel}〜）` };
  if (t < e(local)) return { phaseId: "local", text: `いま地方予選の投票期間中（${local.endLabel}まで）` };
  if (t < s(block)) return { phaseId: null, text: `地方予選は終了。ブロック本選は ${block.startLabel} から` };
  if (t < e(block)) return { phaseId: "block", text: `いまブロック本選の投票期間中（${block.endLabel}まで）` };
  return { phaseId: null, text: `ブロック本選は終了。${GRANDPRIX_NOTE}` };
}
