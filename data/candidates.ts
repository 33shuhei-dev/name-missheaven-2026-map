import type { Entry } from "./types";

/**
 * 調査候補データ（candidate）。
 *
 * ここにあるのは、過去にGPTを使って全国調査した際に見つかった「候補」であり、
 * 一次情報（公式・店舗・本人の掲載）による再検証はまだ行っていない。
 *
 * ルール:
 * - confidence は "unverified"（または根拠がある場合のみ "probable"）。"confirmed" は禁止（検証で弾く）
 * - 架空の sourceUrl / entrantUrl / storeUrl を書かない。確認元URLが判明したら
 *   一次情報で確認したうえで data/verified.ts へ移す（README「確認済みデータへ昇格する方法」参照）
 * - categoryOriginal は調査時に記録された表記をそのまま保持し、似た名称を統合しない
 */

const CATEGORY_ONLY_NOTE =
  "過去のGPT調査で見つかった部門名候補。都道府県・エリア・出場者・確認元は未登録。";
const UNCERTAIN_EXISTENCE_NOTE =
  "過去のGPT調査で「存在する可能性がある」とされた部門名。存在自体が未確認。";

/** 部門名だけが判明している候補（所在地不明）。出現順は調査メモの順。 */
const CATEGORY_ONLY_NAMES: readonly string[] = [
  "前橋・高崎部門",
  "横浜部門",
  "尾張部門",
  "中部デリヘル",
  "次世代看板",
  "次世代看板嬢",
  "ドスケベ痴女",
  "モデル・キレイ",
  "コスプレ大好き",
  "テクニシャン",
  "自慢の美尻",
  "性格がドS",
  "店長一押し",
  "店長イチオシ",
  "スタイル自慢",
  "おっぱい自慢",
  "マッサージ得意",
  "お姉さん",
  "ソープ",
  "レア出勤",
  "ギャンブル大好き",
  "うちは地元が好きじゃけぇ♪",
  "お尻好きならココ",
  "ロリカワ最強",
  "大好き♡おっぱい",
  "デリヘル・エステ",
  "大人の色気",
  "次世代スター",
  "くじら",
  "アイドル",
  "かわいい",
  "ぽっちゃり",
  "ギャル（白・黒）",
  "撮影OK女子",
  "美乳",
  "極嬢",
  "人妻",
  "デリヘル",
  "エステ",
  "アイドルかわいい",
  "大阪府アイドル",
  "隠れ美女",
  "有名店",
  "WEB予約人気嬢",
  "アイドル・ロリ",
  "おしり",
  "コスプレ・アイドル",
  "東京エリア顔出しNG",
  "100名店",
  "ニューヒロイン",
  "美尻・美脚",
  "かわいいアイドル",
  "アイドル・可愛い",
  "スタイル",
  "秋田美人（養殖）",
  "顔出しNG",
  "人妻・熟女",
  "ルックス",
];

/**
 * 検索・比較補助用の正規化名（表示には使わない）。
 * 読みが完全に同一（てんちょういちおし）である表記揺れのみ設定している。
 */
const NORMALIZED: Readonly<Record<string, string>> = {
  店長一押し: "店長いちおし",
  店長イチオシ: "店長いちおし",
};

const categoryOnly: Entry[] = CATEGORY_ONLY_NAMES.map((name, i) => ({
  id: `cand-cat-${String(i + 1).padStart(3, "0")}`,
  categoryOriginal: name,
  ...(NORMALIZED[name] ? { categoryNormalized: NORMALIZED[name] } : {}),
  sourceType: "other",
  confidence: "unverified",
  notes: CATEGORY_ONLY_NOTE,
}));

const uncertainCategories: Entry[] = ["西部部門", "中部部門", "東部部門"].map((name, i) => ({
  id: `cand-maybe-${String(i + 1).padStart(3, "0")}`,
  categoryOriginal: name,
  sourceType: "other",
  confidence: "unverified",
  notes: UNCERTAIN_EXISTENCE_NOTE,
}));

const KAWASAKI_NOTE =
  "過去のGPT調査（川崎）の候補。エリア名「川崎」は調査メモの見出しによるもので、確認元の表記は未確認。";

/** 地域・人物・店舗まで候補が判明しているもの */
const located: Entry[] = [
  // ── 神奈川県・川崎 ─────────────────────────────
  {
    id: "cand-kawasaki-store-01",
    prefecture: "神奈川県",
    area: "川崎",
    storeName: "美人研究所",
    sourceType: "other",
    confidence: "unverified",
    notes: `${KAWASAKI_NOTE} 店舗候補。どの出場者・部門と結び付くかは未確認。`,
  },
  {
    id: "cand-kawasaki-01",
    prefecture: "神奈川県",
    area: "川崎",
    categoryOriginal: "ルックス抜群",
    entrantName: "ゆらのパリジェンヌ",
    sourceType: "other",
    confidence: "unverified",
    notes: KAWASAKI_NOTE,
  },
  {
    id: "cand-kawasaki-02",
    prefecture: "神奈川県",
    area: "川崎",
    categoryOriginal: "コスプレ",
    entrantName: "四代目いくら総長",
    sourceType: "other",
    confidence: "unverified",
    notes: KAWASAKI_NOTE,
  },
  {
    id: "cand-kawasaki-03",
    prefecture: "神奈川県",
    area: "川崎",
    categoryOriginal: "おっぱい",
    entrantName: "なみへ～",
    sourceType: "other",
    confidence: "unverified",
    notes: KAWASAKI_NOTE,
  },
  {
    id: "cand-kawasaki-04",
    prefecture: "神奈川県",
    area: "川崎",
    categoryOriginal: "川崎部門",
    entrantName: "れいぽよ",
    sourceType: "other",
    confidence: "unverified",
    notes: KAWASAKI_NOTE,
  },
  {
    id: "cand-kawasaki-05",
    prefecture: "神奈川県",
    area: "川崎",
    categoryOriginal: "リピート確定",
    entrantName: "ともちん",
    sourceType: "other",
    confidence: "unverified",
    notes: KAWASAKI_NOTE,
  },

  // ── 兵庫県 ─────────────────────────────
  {
    id: "cand-hyogo-01",
    prefecture: "兵庫県",
    categoryOriginal: "尻フェチ天国",
    entrantName: "むう",
    sourceType: "other",
    confidence: "unverified",
    notes:
      "過去のGPT調査（兵庫）の候補。調査メモに「ファッションソープ阪神」の記載あり（店舗名・エリア名・部門名のいずれかは未確認のため、項目には割り当てていない）。",
  },

  // ── 岡山県 ─────────────────────────────
  {
    id: "cand-okayama-01",
    prefecture: "岡山県",
    area: "岡山・倉敷",
    categoryOriginal: "桃女",
    entrantName: "mikan",
    sourceType: "other",
    confidence: "unverified",
    notes:
      "過去のGPT調査（岡山）の候補。「岡山・倉敷」はエリア名として記録されていたが、確認元の表記は未確認。",
  },

  // ── 静岡県 ─────────────────────────────
  {
    id: "cand-shizuoka-store-01",
    prefecture: "静岡県",
    storeName: "ワンナイト",
    sourceType: "other",
    confidence: "unverified",
    notes:
      "過去のGPT調査（静岡）で複数部門・複数出場者の候補を調査済みとされる店舗候補。部門・出場者の詳細データは未登録。",
  },

  // ── 福岡県 ─────────────────────────────
  {
    id: "cand-fukuoka-01",
    prefecture: "福岡県",
    categoryOriginal: "美尻美脚",
    storeName: "TiAmo",
    sourceType: "other",
    confidence: "unverified",
    notes:
      "過去のGPT調査（福岡）の候補。TiAmo から複数の出場者候補が調査済みとされるが、出場者の詳細データは未登録。",
  },
  {
    id: "cand-fukuoka-02",
    prefecture: "福岡県",
    categoryOriginal: "フリースタイル",
    storeName: "TiAmo",
    sourceType: "other",
    confidence: "unverified",
    notes:
      "過去のGPT調査（福岡）の候補。TiAmo から複数の出場者候補が調査済みとされるが、出場者の詳細データは未登録。",
  },
];

export const candidates: readonly Entry[] = [...located, ...categoryOnly, ...uncertainCategories];
