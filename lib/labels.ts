import type { Confidence, Dataset, MapStatus, SourceType } from "@/data/types";

export const CONFIDENCE_ORDER: readonly Confidence[] = ["confirmed", "probable", "unverified"];

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  confirmed: "確認済み",
  probable: "有力情報",
  unverified: "未確認情報",
};

export const CONFIDENCE_DESCRIPTION: Record<Confidence, string> = {
  confirmed:
    "本人日記・店舗告知など一次性の高い情報源で、掲載県・掲載地域と2026年の部門の関係を確認できた情報です（正式な選挙エリアの証明ではありません）。",
  probable:
    "根拠は比較的強いものの、申込段階の留保や関係の不一致など、確認しきれていない点が残る情報です。",
  unverified:
    "転載・検索結果のみなど、元の本文・年度・地域の関係を確認できていない候補情報です。",
};

export const MAP_STATUS_ORDER: readonly MapStatus[] = ["confirmed", "candidate", "searched_no_evidence"];

export const MAP_STATUS_LABEL: Record<MapStatus, string> = {
  confirmed: "確認済み情報あり",
  candidate: "候補情報あり",
  searched_no_evidence: "現在確認できた情報なし",
};

export const MAP_STATUS_DESCRIPTION: Record<MapStatus, string> = {
  confirmed: "根拠の強い（確認済み）情報がある都道府県",
  candidate: "有力情報・未確認情報のみがある都道府県",
  searched_no_evidence:
    "調査済みですが、現在公開情報から部門情報を確認できていない都道府県（部門や出場者がいないという意味ではありません）",
};

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  official: "公式",
  store: "店舗の告知",
  entrant_diary: "本人の日記",
  entrant_social: "本人のSNS",
  other: "転載・第三者",
};

/** 情報源の確認方法（sourceAccessStatus）。未知の値は表示しない */
export const ACCESS_STATUS_LABEL: Record<string, string> = {
  primary_body_checked: "情報源の本文を確認",
  direct_social_checked: "本人SNSを確認",
  primary_search_only: "検索結果の表示のみ（本文未確認）",
  third_party_or_mirror: "転載・第三者サイトで確認",
  baseline_not_reopened: "過去の調査結果を継承（今回は再確認していない）",
};

export const DATASET_LABEL: Record<Dataset, string> = {
  phase1: "Phase 1 データ",
  update: "追加情報",
};

export const UNKNOWN_AREA_LABEL = "掲載地域未判明";

export function confidenceRank(c: Confidence): number {
  return CONFIDENCE_ORDER.indexOf(c);
}

/** 複数レコードのうち最も確度の高い確認状態 */
export function bestConfidence(list: readonly { confidence: Confidence }[]): Confidence {
  let best: Confidence = "unverified";
  for (const r of list) if (confidenceRank(r.confidence) < confidenceRank(best)) best = r.confidence;
  return best;
}
