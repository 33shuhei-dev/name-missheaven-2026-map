/**
 * 地方・都道府県マスタ（JIS X 0401 の都道府県コード順）。
 * 地図UIを本格的なSVG日本地図に置き換える場合も、このマスタの code / slug をキーにする。
 */

export interface Region {
  id: string;
  name: string;
}

export interface Prefecture {
  /** JIS都道府県コード（1〜47） */
  code: number;
  name: string;
  /** URL用スラッグ */
  slug: string;
  regionId: string;
}

export const REGIONS: readonly Region[] = [
  { id: "hokkaido", name: "北海道" },
  { id: "tohoku", name: "東北" },
  { id: "kanto", name: "関東" },
  { id: "chubu", name: "中部" },
  { id: "kinki", name: "近畿" },
  { id: "chugoku", name: "中国" },
  { id: "shikoku", name: "四国" },
  { id: "kyushu", name: "九州・沖縄" },
];

const P = (code: number, name: string, slug: string, regionId: string): Prefecture => ({
  code,
  name,
  slug,
  regionId,
});

export const PREFECTURES: readonly Prefecture[] = [
  P(1, "北海道", "hokkaido", "hokkaido"),
  P(2, "青森県", "aomori", "tohoku"),
  P(3, "岩手県", "iwate", "tohoku"),
  P(4, "宮城県", "miyagi", "tohoku"),
  P(5, "秋田県", "akita", "tohoku"),
  P(6, "山形県", "yamagata", "tohoku"),
  P(7, "福島県", "fukushima", "tohoku"),
  P(8, "茨城県", "ibaraki", "kanto"),
  P(9, "栃木県", "tochigi", "kanto"),
  P(10, "群馬県", "gunma", "kanto"),
  P(11, "埼玉県", "saitama", "kanto"),
  P(12, "千葉県", "chiba", "kanto"),
  P(13, "東京都", "tokyo", "kanto"),
  P(14, "神奈川県", "kanagawa", "kanto"),
  P(15, "新潟県", "niigata", "chubu"),
  P(16, "富山県", "toyama", "chubu"),
  P(17, "石川県", "ishikawa", "chubu"),
  P(18, "福井県", "fukui", "chubu"),
  P(19, "山梨県", "yamanashi", "chubu"),
  P(20, "長野県", "nagano", "chubu"),
  P(21, "岐阜県", "gifu", "chubu"),
  P(22, "静岡県", "shizuoka", "chubu"),
  P(23, "愛知県", "aichi", "chubu"),
  P(24, "三重県", "mie", "kinki"),
  P(25, "滋賀県", "shiga", "kinki"),
  P(26, "京都府", "kyoto", "kinki"),
  P(27, "大阪府", "osaka", "kinki"),
  P(28, "兵庫県", "hyogo", "kinki"),
  P(29, "奈良県", "nara", "kinki"),
  P(30, "和歌山県", "wakayama", "kinki"),
  P(31, "鳥取県", "tottori", "chugoku"),
  P(32, "島根県", "shimane", "chugoku"),
  P(33, "岡山県", "okayama", "chugoku"),
  P(34, "広島県", "hiroshima", "chugoku"),
  P(35, "山口県", "yamaguchi", "chugoku"),
  P(36, "徳島県", "tokushima", "shikoku"),
  P(37, "香川県", "kagawa", "shikoku"),
  P(38, "愛媛県", "ehime", "shikoku"),
  P(39, "高知県", "kochi", "shikoku"),
  P(40, "福岡県", "fukuoka", "kyushu"),
  P(41, "佐賀県", "saga", "kyushu"),
  P(42, "長崎県", "nagasaki", "kyushu"),
  P(43, "熊本県", "kumamoto", "kyushu"),
  P(44, "大分県", "oita", "kyushu"),
  P(45, "宮崎県", "miyazaki", "kyushu"),
  P(46, "鹿児島県", "kagoshima", "kyushu"),
  P(47, "沖縄県", "okinawa", "kyushu"),
];

/** 都道府県が不明なデータをまとめるための疑似スラッグ */
export const UNKNOWN_PREFECTURE_SLUG = "unknown";
export const UNKNOWN_PREFECTURE_LABEL = "地域未判明";

const byName = new Map(PREFECTURES.map((p) => [p.name, p]));
const bySlug = new Map(PREFECTURES.map((p) => [p.slug, p]));

export function findPrefectureByName(name: string | undefined): Prefecture | undefined {
  return name ? byName.get(name) : undefined;
}

export function findPrefectureBySlug(slug: string): Prefecture | undefined {
  return bySlug.get(slug);
}

export function prefecturesInRegion(regionId: string): Prefecture[] {
  return PREFECTURES.filter((p) => p.regionId === regionId);
}
