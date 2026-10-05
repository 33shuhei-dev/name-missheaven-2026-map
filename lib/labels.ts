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

/**
 * 店舗の参加情報の表示名。内部の confidence はそのまま、利用者には「何を確認できているか」で伝える。
 * （観測・部門の確認状態は CONFIDENCE_LABEL のまま）
 */
export const STORE_CONFIDENCE_LABEL: Record<Confidence, string> = {
  confirmed: "参加確認済み",
  probable: "参加情報あり",
  unverified: "参加情報を1件確認",
};

export const STORE_CONFIDENCE_DESCRIPTION: Record<Confidence, string> = {
  confirmed: "店舗の告知・本人の日記などの本文で、2026年の参加を直接確認した店舗です。",
  probable:
    "店舗ページの検索結果や店舗の告知などで、2026年の参加（エントリー・ノミネート・出場など）の記載を複数確認した店舗です。",
  unverified:
    "店舗ページの検索結果などで、2026年の参加（エントリー・ノミネート・出場など）の具体的な記載を1件確認した店舗です。",
};

export const MAP_STATUS_ORDER: readonly MapStatus[] = ["confirmed", "candidate", "searched_no_evidence"];

export const MAP_STATUS_LABEL: Record<MapStatus, string> = {
  confirmed: "確認済み情報あり",
  candidate: "参加情報あり",
  searched_no_evidence: "現在確認できた情報なし",
};

export const MAP_STATUS_DESCRIPTION: Record<MapStatus, string> = {
  confirmed: "根拠の強い（確認済み）部門・参加店舗の情報がある都道府県",
  candidate: "検索結果・店舗の告知などで、2026年の参加情報を確認している都道府県（本文での直接確認はまだのもの）",
  searched_no_evidence:
    "調査済みですが、現在公開情報から部門・参加店舗の情報を確認できていない都道府県（部門や出場者がいないという意味ではありません）",
};

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  official: "公式・公式媒体",
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

/* ───────────── Phase 3：参加店舗 ───────────── */

/** 店舗の参加根拠の種類（participationType） */
export const PARTICIPATION_TYPE_LABEL: Record<string, string> = {
  baseline_observation: "部門の観測から確認",
  entry_reported: "店舗の告知でエントリーを確認",
  group_entry_claim: "系列としての出場告知",
  candidate: "候補（未確認）",
  store_banner_reported: "店舗ページの告知バナーで確認（利用者からの情報提供）",
  search_index_reported: "店舗ページ（ヘブン掲載）の検索結果で参加の記載を確認",
  official_site_reported: "店舗の公式サイトで参加を確認",
};

/** 店舗公開ページのリンク状態（publicUrlAccessStatus） */
export const PUBLIC_URL_STATUS_NOTE: Record<string, string | null> = {
  primary_body_checked: null,
  inherited_not_rechecked: "このリンクは以前の調査で記録したもので、今回は再確認していません。",
  linked_fetch_failed: "調査時にこのリンク先を取得できませんでした（未再確認）。",
  unknown: "リンク先の到達状況は確認していません。",
};

/** 情報源の役割（store_sources の publisherRole）。大会運営と店舗の自己告知を区別する */
export const PUBLISHER_ROLE_LABEL: Record<string, string> = {
  event_organizer: "大会運営の公式案内",
  official_media_guide: "公式媒体の案内",
  store_announcement: "店舗の告知",
  search_engine_result: "検索結果（店舗ページの抜粋）",
  store_public_page: "店舗の公開ページ",
  store_geography: "店舗の所在地情報",
  campaign_support: "応援キャンペーンの案内",
};

/** 情報源のアクセス状態（store_sources の accessStatus） */
export const SOURCE_ACCESS_LABEL: Record<string, string> = {
  primary_body_checked: "本文を確認",
  inherited_not_rechecked: "以前の確認を継承（今回は再確認していない）",
  linked_fetch_failed: "取得に失敗",
  indexed_only_403: "検索結果のみ（本文は取得不可）",
  indexed_only_fetch_failed: "検索結果のみ（本文の取得に失敗）",
  user_screenshot_only: "利用者提供のスクリーンショットで確認（調査側は本文を直接取得していない）",
  search_index_only: "検索結果の抜粋で確認（本文は直接取得していない）",
};

/** Phase 2 の人数の種類（countType）。在籍・申込・出場・ノミネートを混同しない */
export const COUNT_TYPE_LABEL: Record<string, { label: string; note: string }> = {
  declared_web_application_count: {
    label: "WEB申込の掲載人数",
    note: "申込段階の掲載人数です。正式なノミネート人数・出場人数ではありません。",
  },
  store_declared_entry_count: {
    label: "店舗が告知したエントリー人数",
    note: "店舗の告知に書かれた人数です。正式なノミネート人数とは照合していません。",
  },
};

/** 店舗の確認方法（verificationMethod。Phase 3b 以降） */
export const VERIFICATION_METHOD_LABEL: Record<string, string> = {
  search_index_multiple:
    "検索結果で、この店舗の複数のページ（店舗トップ・在籍ページ・日記など）に2026年の参加（エントリー・ノミネート・出場など）の記載を確認",
  search_index_single: "検索結果で、この店舗のページに2026年の参加（エントリー・ノミネート・出場など）の記載を1件確認",
  official_site_body: "店舗の公式サイトの本文で2026年の参加を確認",
  user_screenshot: "利用者提供のスクリーンショットで店舗の告知を確認",
};
