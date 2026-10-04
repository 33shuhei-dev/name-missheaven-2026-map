import type { Confidence, Dataset, SourceType } from "@/data/types";

export const CONFIDENCE_ORDER: readonly Confidence[] = ["confirmed", "probable", "unverified"];

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  confirmed: "確認済み",
  probable: "有力情報",
  unverified: "未確認",
};

export const CONFIDENCE_DESCRIPTION: Record<Confidence, string> = {
  confirmed: "公式・店舗・本人などの確認元で掲載を確認できた情報です。",
  probable: "確認元はありますが、最終的な確認が完全ではない情報です。",
  unverified: "調査候補として記録しているだけの情報です。事実と確認できていません。",
};

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  official: "公式",
  store: "店舗",
  entrant_diary: "本人の日記",
  entrant_social: "本人のSNS",
  other: "その他",
};

export const DATASET_LABEL: Record<Dataset, string> = {
  verified: "確認元あり",
  candidate: "調査候補",
};

export const UNKNOWN_AREA_LABEL = "エリア未判明";

export function confidenceRank(c: Confidence): number {
  return CONFIDENCE_ORDER.indexOf(c);
}

/** 複数レコードのうち最も確度の高い確認状態 */
export function bestConfidence(list: readonly { confidence: Confidence }[]): Confidence {
  let best: Confidence = "unverified";
  for (const r of list) if (confidenceRank(r.confidence) < confidenceRank(best)) best = r.confidence;
  return best;
}
