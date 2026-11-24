/**
 * ブロック本選の「各ブロックの部門者数」。
 * 出典：Xアカウント @hiropyon_0405 の集計（2026-11-24 12:06 の投稿とそのスレッド）。公式の発表ではない。
 * 部門の並びは、投稿の表記のまま（デリヘル／ヘルス・ホテヘル／ソープ／エステ／人妻）。
 * 補正：投稿の2か所は、部門の合計と合わないため、私たちが直した（直した理由は特集4に書く）。
 *   ・東京の「計1951人」→ 部門の合計の1,591人
 *   ・九州北のデリヘル「672人」→ 計672人から他の4部門を引いた175人
 * 補正すると、10ブロックの合計が、投稿の総数（7,594人）と一致する。
 */
export const HONSEN_DEPTS = ["デリヘル", "ヘルス・ホテヘル", "ソープ", "エステ", "人妻"] as const;

export const HONSEN_TOTAL = 7594;

/** 部門の並びは HONSEN_DEPTS の順。北陸・甲信越のヘルス・ホテヘルは「部門なし」と書かれていたので0 */
export const HONSEN: readonly { block: string; counts: readonly [number, number, number, number, number] }[] = [
  { block: "北海道・東北", counts: [258, 83, 185, 62, 150] },
  { block: "東京", counts: [620, 121, 530, 129, 191] },
  { block: "北関東", counts: [140, 20, 330, 15, 83] },
  { block: "南関東", counts: [152, 62, 349, 30, 137] },
  { block: "北陸・甲信越", counts: [174, 0, 72, 42, 94] },
  { block: "東海", counts: [368, 232, 134, 77, 174] },
  { block: "関西", counts: [335, 206, 338, 89, 157] },
  { block: "中四国", counts: [153, 42, 156, 35, 121] },
  { block: "九州北", counts: [175, 40, 300, 47, 110] },
  { block: "九州南・沖縄", counts: [132, 18, 71, 14, 41] },
];

export function honsenBlockTotal(block: string): number {
  const r = HONSEN.find((b) => b.block === block);
  return r ? r.counts.reduce((s, n) => s + n, 0) : 0;
}

export function honsenDeptTotals(): number[] {
  return HONSEN_DEPTS.map((_, i) => HONSEN.reduce((s, b) => s + b.counts[i], 0));
}

/** ブロック×部門の「小さな選挙」。人数が0（部門なし）のものは除く */
export function honsenCells(): { block: string; dept: string; n: number }[] {
  return HONSEN.flatMap((b) => b.counts.map((n, i) => ({ block: b.block, dept: HONSEN_DEPTS[i], n }))).filter((c) => c.n > 0);
}

/** 順位アイコンは「各部門10位以内」（ヘブンnavi 2026-11-10）。ブロック×部門ごとに10位までとして数える */
export const ICON_RANK = 10;
export function iconSlots(n: number): number {
  return Math.min(ICON_RANK, n);
}
