import pilot3 from "./stores/pilot3-2026-10-06.json";
import national from "./stores/national-2026-10-06.json";
import finishing from "./stores/finishing-2026-10-06.json";
import snsFound from "./stores/sns-found-2026-10-08.json";
import discovery from "./stores/discovery-2026-10-08.json";
import harvest from "./stores/harvest-2026-10-27.json";
import type { Phase3RawRelation, Phase3RawSource, Phase3RawStore, StoreListingAreaUpdate, StorePublicUrlUpdate } from "./types";

/** 3都道府県パイロット（大阪府・宮城県・青森県、2026-10-06）の追加分 */
const pilot3Batch = pilot3 as unknown as {
  stores: Phase3RawStore[];
  relations: Phase3RawRelation[];
  sources: Phase3RawSource[];
  listingAreaUpdates: StoreListingAreaUpdate[];
};

/** 探索仮説の検証（店舗内の深掘りなど。2026-10-08）の追加分。形は仕上げPhaseと同じ */
const discoveryBatch = discovery as unknown as {
  stores: Phase3RawStore[];
  relations: Phase3RawRelation[];
  sources: Phase3RawSource[];
  listingAreaUpdates: StoreListingAreaUpdate[];
  publicUrlUpdates: StorePublicUrlUpdate[];
};

/** 投票期間の定期収集（Yahoo!リアルタイム検索）で、本人の出場表明を確認して追加した分（2026-10-27〜） */
const harvestBatch = harvest as unknown as {
  stores: Phase3RawStore[];
  relations: Phase3RawRelation[];
  sources: Phase3RawSource[];
  listingAreaUpdates: StoreListingAreaUpdate[];
  publicUrlUpdates: StorePublicUrlUpdate[];
};

/** 本人SNSの出場表明を検索結果で確認して追加した分（2026-10-08。本人からの掲載申請ではない）。形は仕上げPhaseと同じ */
const snsFoundBatch = snsFound as unknown as {
  stores: Phase3RawStore[];
  relations: Phase3RawRelation[];
  sources: Phase3RawSource[];
  listingAreaUpdates: StoreListingAreaUpdate[];
  publicUrlUpdates: StorePublicUrlUpdate[];
};

/** 仕上げPhase（2026-10-06）の追加分（店名を確認できた店舗の救済、東京・大阪の続き、エリア分割検索）。形は全国展開と同じ */
const finishingBatch = finishing as unknown as {
  stores: Phase3RawStore[];
  relations: Phase3RawRelation[];
  sources: Phase3RawSource[];
  listingAreaUpdates: StoreListingAreaUpdate[];
  publicUrlUpdates: StorePublicUrlUpdate[];
};

/** 全国展開（2026-10-06）の追加分。既存店舗の掲載地域・公開ページURLの補完を含む */
const nationalBatch = national as unknown as {
  stores: Phase3RawStore[];
  relations: Phase3RawRelation[];
  sources: Phase3RawSource[];
  listingAreaUpdates: StoreListingAreaUpdate[];
  publicUrlUpdates: StorePublicUrlUpdate[];
};

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
 * - 人物名はここには書かない。出場者は data/entrant-updates.ts に記録する
 * - 画像（宣材・告知バナー）は保存しない。リンクと必要最小限の事実だけを書く
 */

const manualStores: Phase3RawStore[] = [
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
      "利用者からの情報提供（2026-10-05）。ヘブン掲載の店舗ページ上部の告知バナーに「全国ミスヘブン総選挙2026」「デリヘル部門」「ゆず」「NOMINATION」「地方予選 投票開始 10.28(水) 12:00〜」の表記があることを、利用者提供のスクリーンショットで確認。店舗ページの表記は「デリヘル(スタンダード/厚木)」。調査環境からは当該サイトにアクセスできず、本文の直接確認はしていないため probable。大会運営による一覧での確認ではない。正式選挙エリアは未確認。",
  },
  // ── 本人申請を起点に追加（2026-10-06）。店舗の公開ページURL・掲載地域は提供されておらず、推測していないため空欄 ──
  {
    storeId: "mh26-upd-store-0002",
    storeName: "AMOR-アモル-",
    storeNameOriginals: ["AMOR-アモル-"],
    prefecture: "福岡県",
    listingArea: null,
    listingAreas: [],
    formalElectionArea: null,
    categoryOriginal: null,
    categoryOriginals: [],
    participationEvidenceUrl: "https://x.com/princess1224mei",
    storePublicUrl: null,
    sourceType: "entrant_social",
    confidence: "unverified",
    participationType: "entrant_self_reported",
    checkedAt: "2026-10-06",
    phase1RecordIds: [],
    phase2RecordIds: [],
    isNewSincePhase1: true,
    sourceIds: ["upd-src-0003"],
    publicUrlAccessStatus: "unknown",
    notes:
      "本人申請を起点に追加（2026-10-06）。所属する出場者（恋仲めい）本人から掲載希望があり、本人Xの2026年10月6日の投稿で出場表明を確認。店舗自身の告知は確認していないため unverified。店舗の公開ページURL・掲載地域は未確認（推測しない）。正式選挙エリアは未確認。",
  },
  // ── 本人申請を起点に追加（2026-10-27）。本人から掲載希望があり、本人Xの固定投稿と店舗の在籍ページ（スクリーンショット）で確認 ──
  {
    storeId: "mh26-upd-store-0003",
    storeName: "THEOBROMA",
    storeNameOriginals: ["THEOBROMA"],
    prefecture: "熊本県",
    listingArea: null,
    listingAreas: [],
    formalElectionArea: null,
    categoryOriginal: null,
    categoryOriginals: [],
    participationEvidenceUrl: "https://www.cityheaven.net/kumamoto/A4301/A430102/theobroma/girlid-53272511/",
    storePublicUrl: "https://www.cityheaven.net/kumamoto/A4301/A430102/theobroma/",
    sourceType: "entrant_social",
    confidence: "unverified",
    participationType: "entrant_self_reported",
    checkedAt: "2026-10-27",
    phase1RecordIds: [],
    phase2RecordIds: [],
    isNewSincePhase1: true,
    sourceIds: ["upd-src-0004"],
    publicUrlAccessStatus: "unknown",
    notes:
      "本人申請を起点に追加（2026-10-27）。所属する出場者（いろは）本人から掲載希望があり、本人提供のスクリーンショット（本人Xの固定投稿・ヘブンの在籍ページ）で確認。都道府県・公開ページURLは、本人が提供した在籍ページのURL（kumamoto/A4301/A430102/theobroma）の表記どおり。店名は在籍ページの画像の店舗ロゴの表記「THEOBROMA」（正式な表記が異なる場合は修正する）。店舗自身の告知は確認していないため unverified。掲載地域・正式選挙エリアは未確認。",
  },
  // ── 掲載依頼（第三者）を起点に追加（2026-10-27）。依頼者提供の在籍ページURLとスクリーンショット（ノミネートのバッジ）で確認 ──
  {
    storeId: "mh26-upd-store-0004",
    storeName: "ラブローズ 岩手",
    storeNameOriginals: ["ラブローズ 岩手", "LoveRose"],
    prefecture: "岩手県",
    listingArea: null,
    listingAreas: [],
    formalElectionArea: null,
    categoryOriginal: "岩手デリヘル部門",
    categoryOriginals: ["岩手デリヘル部門"],
    participationEvidenceUrl: "https://www.cityheaven.net/iwate/A0302/A030201/loverose/girlid-66164536/",
    storePublicUrl: "https://www.cityheaven.net/iwate/A0302/A030201/loverose/",
    sourceType: "store",
    confidence: "probable",
    participationType: "store_banner_reported",
    checkedAt: "2026-10-27",
    phase1RecordIds: [],
    phase2RecordIds: [],
    isNewSincePhase1: true,
    sourceIds: ["upd-src-0005"],
    publicUrlAccessStatus: "unknown",
    notes:
      "掲載依頼（第三者）を起点に追加（2026-10-27）。依頼者提供のヘブン在籍ページのURLとスクリーンショットで、在籍ページの画像に「全国ミスヘブン総選挙2026」「岩手県」「岩手デリヘル部門 ノミネート」のバッジを確認。店名は依頼文の「ラブローズ 岩手」と在籍ページのタイトルの「LoveRose」（途中で途切れている）。都道府県・公開ページURLは在籍ページURL（iwate/A0302/A030201/loverose）の表記どおり。部門名は依頼文では「デリヘル部門」だが、バッジの表記「岩手デリヘル部門」を採用。調査環境からは本文を直接確認していないため probable。掲載地域・正式選挙エリアは未確認。",
  },
  // ── 掲載依頼（第三者）を起点に追加（2026-10-28）。依頼者提供の在籍ページのURLとスクリーンショット（「ミスヘブン出場決定」の表示）で確認 ──
  {
    storeId: "mh26-upd-store-0005",
    storeName: "カナーズ 岐阜本店",
    storeNameOriginals: ["カナーズ 岐阜本店", "カナーズ", "KANAAAAZ", "ガナーズ"],
    prefecture: "岐阜県",
    listingArea: null,
    listingAreas: [],
    formalElectionArea: null,
    categoryOriginal: null,
    categoryOriginals: [],
    participationEvidenceUrl: "https://www.cityheaven.net/gifu/A2101/A210101/yakata/girlid-48942563/",
    storePublicUrl: "https://www.cityheaven.net/gifu/A2101/A210101/yakata/",
    sourceType: "store",
    confidence: "unverified",
    participationType: "store_banner_reported",
    checkedAt: "2026-10-28",
    phase1RecordIds: [],
    phase2RecordIds: [],
    isNewSincePhase1: true,
    sourceIds: ["upd-src-0006"],
    publicUrlAccessStatus: "unknown",
    notes:
      "掲載依頼（第三者）を起点に追加（2026-10-28）。依頼者提供のヘブン在籍ページのURLとスクリーンショットで、在籍ページに「ミスヘブン出場決定」の表示を確認（年の表記はなく、スクリーンショットは2026年10月23日（金）に撮影されたもの）。店名は在籍ページのロゴの表記「カナーズ KANAAAAZ 岐阜本店」（依頼文では「ガナーズ」。同一の店と判断し、両方を別表記として記録）。都道府県・公開ページURLは在籍ページURL（gifu/A2101/A210101/yakata）の表記どおり。店舗自身の告知・ノミネートのバッジは確認していないため unverified。掲載地域・正式選挙エリアは未確認。",
  },
  // ── 出場者本人からの掲載依頼（DM）を起点に追加（2026-10-28）。出場表明の投稿・ノミネートのバッジは未確認 ──
  {
    storeId: "mh26-upd-store-0006",
    storeName: "秋葉原コスプレ学園IN西川口",
    storeNameOriginals: ["秋葉原コスプレ学園IN西川口"],
    prefecture: "埼玉県",
    listingArea: null,
    listingAreas: [],
    formalElectionArea: null,
    categoryOriginal: null,
    categoryOriginals: [],
    participationEvidenceUrl: "https://www.cityheaven.net/saitama/A1102/A110201/akikosu/girlid-58859583/",
    storePublicUrl: "https://www.cityheaven.net/saitama/A1102/A110201/akikosu/",
    sourceType: "store",
    confidence: "probable",
    participationType: "store_banner_reported",
    checkedAt: "2026-10-28",
    phase1RecordIds: [],
    phase2RecordIds: [],
    isNewSincePhase1: true,
    sourceIds: ["upd-src-0007"],
    publicUrlAccessStatus: "unknown",
    notes:
      "出場者本人からの掲載依頼（DM、2026-10-27）を起点に追加。依頼文に名前・店舗名（秋葉原コスプレ学園IN西川口）・部門（ヘルス部門）・都道府県（埼玉県）があり、本人が提供した在籍ページのURL（saitama/A1102/A110201/akikosu）で都道府県と店舗ページを確認。その後（2026-10-28）、本人提供の在籍ページのスクリーンショットで、画像に「全国ミスヘブン総選挙2026」「埼玉県」「ヘルス部門 ノミネート」のバッジを確認した。調査環境からは本文を直接確認していないため probable。東京都の「秋葉原コスプレ学園」（店舗キー a_maid）とは別の店舗。掲載地域・正式選挙エリアは未確認。",
  },
  // ── 掲載依頼（DM）を起点に追加（2026-10-30）。出場の表示・部門は未確認 ──
  {
    storeId: "mh26-upd-store-0007",
    storeName: "エコ梅田店",
    storeNameOriginals: ["エコ梅田店"],
    prefecture: "大阪府",
    listingArea: "梅田・北新地",
    listingAreas: ["梅田・北新地"],
    formalElectionArea: null,
    categoryOriginal: null,
    categoryOriginals: [],
    participationEvidenceUrl: "https://share.google/yWqPfsdcaakuZPXVH",
    storePublicUrl: null,
    sourceType: "store",
    confidence: "probable",
    participationType: "store_banner_reported",
    checkedAt: "2026-10-30",
    phase1RecordIds: [],
    phase2RecordIds: [],
    isNewSincePhase1: true,
    sourceIds: ["upd-src-0009"],
    publicUrlAccessStatus: "unknown",
    notes:
      "掲載依頼（DM、2026-10-30）を起点に追加。依頼者提供の「「はな」エコ梅田店 - 梅田・北新地/ホテヘル｜シティヘブンネット」のGoogle共有リンクのタイトルによる（リンク先の店舗ページは未確認）。都道府県は、掲載地域の表記「梅田・北新地」が大阪府にしかない地名であることから判断（店名には都道府県の記載なし）。その後、依頼者提供のスクリーンショットで在籍ページの画像に「全国ミスヘブン総選挙2026」「ニューヒロイン エントリー中」のバッジを確認したため probable（部門名の表記はなく、部門は未確認）。店舗ページのURLは推測しない。正式選挙エリアは未確認。",
  },
  // ── 掲載依頼（DM）を起点に追加（2026-10-30）。在籍ページの画像のノミネートのバッジ（スクリーンショット）で確認 ──
  {
    storeId: "mh26-upd-store-0008",
    storeName: "風神会館",
    storeNameOriginals: ["風神会館"],
    prefecture: "東京都",
    listingArea: "新宿・歌舞伎町",
    listingAreas: ["新宿・歌舞伎町"],
    formalElectionArea: null,
    categoryOriginal: null,
    categoryOriginals: [],
    participationEvidenceUrl: "https://share.google/sG9b7GOn9lCllDOyg",
    storePublicUrl: null,
    sourceType: "store",
    confidence: "probable",
    participationType: "store_banner_reported",
    checkedAt: "2026-10-30",
    phase1RecordIds: [],
    phase2RecordIds: [],
    isNewSincePhase1: true,
    sourceIds: ["upd-src-0010"],
    publicUrlAccessStatus: "unknown",
    notes:
      "掲載依頼（DM、2026-10-30）を起点に追加。依頼者提供のスクリーンショット（在籍ページのタイトル「「ななみ蛇舌神業AV女優」風神会館 - 新宿・歌舞伎町/デリヘル｜シティヘブンネット」）で店名・掲載地域・業態を確認し、在籍ページの画像に「全国ミスヘブン総選挙2026」「東京都」「ギャル(白・黒)部門 ノミネート」のバッジを確認。部門名は既存の「ギャル（白・黒）部門」の表記に合わせた。依頼者提供のリンクはGoogleの共有リンクで、店舗ページのURL自体は未確認（推測しない）。調査環境からは本文を直接確認していないため probable。正式選挙エリアは未確認。",
  },
];

const manualRelations: Phase3RawRelation[] = [
  {
    relationId: "upd-rel-0001",
    storeId: "mh26-upd-store-0001",
    categoryOriginal: "デリヘル部門",
    categoryNormalized: null,
    confidence: "probable",
    sourceIds: ["upd-src-0001"],
    phase1RecordIds: [],
    notes: "告知バナーの部門表記。店舗の全員がこの部門という意味ではない（バナーの出場者は data/entrant-updates.ts）。",
  },
  {
    relationId: "upd-rel-0002",
    storeId: "mh26-upd-store-0004",
    categoryOriginal: "岩手デリヘル部門",
    categoryNormalized: null,
    confidence: "probable",
    sourceIds: ["upd-src-0005"],
    phase1RecordIds: [],
    notes: "在籍ページの画像のバッジの部門表記（掲載依頼のスクリーンショット）。店舗の全員がこの部門という意味ではない。",
  },
];

const manualSources: Phase3RawSource[] = [
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
  {
    sourceId: "upd-src-0002",
    url: "https://www.cityheaven.net/kanagawa/A1401/A140103/onemorecoming/",
    sourceType: "store",
    accessStatus: "search_index_only",
    publisherRole: "store_public_page",
    storeIds: ["mh26-store-b33dc19606e7c823"],
    relationIds: [],
    checkedAt: "2026-10-05",
    notes:
      "Phase 3b 全国走査で、ヘブンの店舗ページ（店舗キー kanagawa/A1401/A140103/onemorecoming、店名「One More 奥様 横浜関内店」）が既存の店舗と同一と照合済み（data/phase3b/research_log.json の matchedExisting）。ページ本文は調査環境から取得していない。",
  },
  {
    sourceId: "upd-src-0003",
    url: "https://x.com/princess1224mei",
    sourceType: "entrant_social",
    accessStatus: "user_reported_only",
    publisherRole: "entrant_social_post",
    storeIds: ["mh26-upd-store-0002"],
    relationIds: [],
    checkedAt: "2026-10-06",
    notes: "所属する出場者本人のXアカウント。2026年10月6日の本人の出場表明（本人申請の内容）による。本人申請を起点に追加",
  },
  {
    sourceId: "upd-src-0004",
    url: "https://www.cityheaven.net/kumamoto/A4301/A430102/theobroma/girlid-53272511/",
    sourceType: "entrant_social",
    accessStatus: "user_screenshot_only",
    publisherRole: "entrant_social_post",
    storeIds: ["mh26-upd-store-0003"],
    relationIds: [],
    checkedAt: "2026-10-27",
    notes: "所属する出場者本人から提供された在籍ページのURLとスクリーンショット（本人Xの固定投稿を含む）。画像は保存していない。本人申請を起点に追加",
  },
  {
    sourceId: "upd-src-0005",
    url: "https://www.cityheaven.net/iwate/A0302/A030201/loverose/girlid-66164536/",
    sourceType: "store",
    accessStatus: "user_screenshot_only",
    publisherRole: "store_announcement",
    storeIds: ["mh26-upd-store-0004"],
    relationIds: ["upd-rel-0002"],
    checkedAt: "2026-10-27",
    notes: "掲載依頼（第三者）を起点に追加。依頼者提供の在籍ページのURLとスクリーンショットで、ノミネートのバッジ（全国ミスヘブン総選挙2026・岩手県・岩手デリヘル部門）を確認。画像は保存していない。",
  },
  {
    sourceId: "upd-src-0006",
    url: "https://www.cityheaven.net/gifu/A2101/A210101/yakata/girlid-48942563/",
    sourceType: "store",
    accessStatus: "user_screenshot_only",
    publisherRole: "entrant_page",
    storeIds: ["mh26-upd-store-0005"],
    relationIds: [],
    checkedAt: "2026-10-28",
    notes: "掲載依頼（第三者）を起点に追加。依頼者提供の在籍ページのURLと、在籍ページのスクリーンショット（「ミスヘブン出場決定」の表示、店舗ロゴ）。画像は保存していない。",
  },
  {
    sourceId: "upd-src-0007",
    url: "https://www.cityheaven.net/saitama/A1102/A110201/akikosu/girlid-58859583/",
    sourceType: "store",
    accessStatus: "user_screenshot_only",
    publisherRole: "store_announcement",
    storeIds: ["mh26-upd-store-0006"],
    relationIds: [],
    checkedAt: "2026-10-28",
    notes: "出場者本人から提供された在籍ページのURLとスクリーンショット（本人からの掲載依頼）で、ノミネートのバッジ（全国ミスヘブン総選挙2026・埼玉県・ヘルス部門）を確認。画像は保存していない。出場者本人の依頼を起点に追加",
  },
  {
    sourceId: "upd-src-0008",
    url: "https://www.cityheaven.net/ibaraki/A0804/A080401/reddiamond/girlid-56904611/",
    sourceType: "store",
    accessStatus: "user_screenshot_only",
    publisherRole: "store_announcement",
    storeIds: ["mh26-sns-store-a38f659d81dbfcd3"],
    relationIds: [],
    checkedAt: "2026-10-28",
    notes: "出場者（さくらこ）本人から提供された在籍ページのURLとスクリーンショット。店舗名「神栖レッドダイヤ」（デリヘル／神栖市）の在籍ページで、店舗の公開ページのURLを確認。画像は保存していない。",
  },
  {
    sourceId: "upd-src-0009",
    url: "https://share.google/yWqPfsdcaakuZPXVH",
    sourceType: "store",
    accessStatus: "user_screenshot_only",
    publisherRole: "entrant_page",
    storeIds: ["mh26-upd-store-0007"],
    relationIds: [],
    checkedAt: "2026-10-30",
    notes: "掲載依頼者から提供されたGoogle共有リンク（タイトル「「はな」エコ梅田店 - 梅田・北新地/ホテヘル｜シティヘブンネット」）。リンク先は未確認。掲載依頼を起点に追加",
  },
  {
    sourceId: "upd-src-0010",
    url: "https://share.google/sG9b7GOn9lCllDOyg",
    sourceType: "store",
    accessStatus: "user_screenshot_only",
    publisherRole: "store_announcement",
    storeIds: ["mh26-upd-store-0008"],
    relationIds: [],
    checkedAt: "2026-10-30",
    notes: "掲載依頼者から提供された在籍ページのスクリーンショット（ノミネートのバッジ：全国ミスヘブン総選挙2026・東京都・ギャル(白・黒)部門）とGoogle共有リンク。リンク先は未確認。画像は保存していない。掲載依頼を起点に追加",
  },
];

export const storeUpdates: Phase3RawStore[] = [...manualStores, ...pilot3Batch.stores, ...nationalBatch.stores, ...finishingBatch.stores, ...snsFoundBatch.stores, ...discoveryBatch.stores, ...harvestBatch.stores];
export const relationUpdates: Phase3RawRelation[] = [...manualRelations, ...pilot3Batch.relations, ...nationalBatch.relations, ...finishingBatch.relations, ...snsFoundBatch.relations, ...discoveryBatch.relations, ...harvestBatch.relations];
export const sourceUpdates: Phase3RawSource[] = [...manualSources, ...pilot3Batch.sources, ...nationalBatch.sources, ...finishingBatch.sources, ...snsFoundBatch.sources, ...discoveryBatch.sources, ...harvestBatch.sources];

/**
 * 既存店舗の店舗公開ページURLの補完。元の店舗データ（Phase 3 など）にURLがなく、
 * 保存済みの証拠から確実に特定できた場合だけ追加する（推測したURLは入れない）。
 */
const manualPublicUrlUpdates: StorePublicUrlUpdate[] = [
  {
    storeId: "mh26-store-b33dc19606e7c823",
    storePublicUrl: "https://www.cityheaven.net/kanagawa/A1401/A140103/onemorecoming/",
    sourceIds: ["upd-src-0002"],
    notes: "One More 奥様 横浜関内店。Phase 3b の照合記録による。",
  },
  {
    storeId: "mh26-sns-store-a38f659d81dbfcd3",
    storePublicUrl: "https://www.cityheaven.net/ibaraki/A0804/A080401/reddiamond/",
    sourceIds: ["upd-src-0008"],
    notes: "神栖レッドダイヤ。出場者本人から提供された在籍ページのURL（ibaraki/A0804/A080401/reddiamond）の店舗部分。",
  },
];

export const storePublicUrlUpdates: StorePublicUrlUpdate[] = [...manualPublicUrlUpdates, ...nationalBatch.publicUrlUpdates, ...finishingBatch.publicUrlUpdates, ...snsFoundBatch.publicUrlUpdates, ...discoveryBatch.publicUrlUpdates, ...harvestBatch.publicUrlUpdates];

/**
 * 既存店舗の掲載地域の補完。元の店舗データに掲載地域がなく、店舗キー・店名が一致するページの
 * 掲載地域表記から確実に特定できた場合だけ追加する（推測しない。正式選挙エリアとは別）。
 */
export const storeListingAreaUpdates: StoreListingAreaUpdate[] = [...pilot3Batch.listingAreaUpdates, ...nationalBatch.listingAreaUpdates, ...finishingBatch.listingAreaUpdates, ...snsFoundBatch.listingAreaUpdates, ...discoveryBatch.listingAreaUpdates, ...harvestBatch.listingAreaUpdates];
