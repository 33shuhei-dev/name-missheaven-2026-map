import { describe, expect, it } from "vitest";
import { buildModel, toRecords, areaIdOf } from "@/lib/model";
import { buildPlaceIndex, searchPlaces, searchRecords } from "@/lib/search";
import { fixtureSets } from "./fixtures";

const records = toRecords(fixtureSets);
const model = buildModel(records);
const ids = (q: Parameters<typeof searchRecords>[1]) => searchRecords(records, q).map((h) => h.record.id);

describe("全国横断検索", () => {
  it("検索語なしなら全件を返す", () => {
    expect(ids({})).toHaveLength(records.length);
    expect(ids({ q: "   " })).toHaveLength(records.length);
  });

  it("都道府県名で検索できる（部分一致・県なし）", () => {
    expect(ids({ q: "神奈川" }).sort()).toEqual(["t-c-7", "t-v-1", "t-v-2"]);
    expect(ids({ q: "神奈川県" })).toHaveLength(3);
  });

  it("地方名・ローマ字でも都道府県を検索できる", () => {
    expect(ids({ q: "九州" })).toEqual(["t-v-3"]);
    expect(ids({ q: "fukuoka" })).toEqual(["t-v-3"]);
  });

  it("エリア名で検索できる", () => {
    expect(ids({ q: "サンプル" })).toEqual(["t-v-3"]);
  });

  it("部門名で部分一致検索できる", () => {
    expect(ids({ q: "アイドル" }).sort()).toEqual(["t-c-3", "t-c-4"]);
    expect(ids({ q: "コスプ" })).toEqual(["t-c-7"]);
  });

  it("出場者名・店舗名で検索できる", () => {
    expect(ids({ q: "テスト出場者C" })).toEqual(["t-v-3"]);
    expect(ids({ q: "テスト店舗Z" })).toEqual(["t-c-6"]);
    expect(ids({ q: "テスト店舗" }).sort()).toEqual(["t-c-6", "t-v-1", "t-v-3"]);
  });

  it("空白区切りはAND検索", () => {
    expect(ids({ q: "神奈川 コスプレ" })).toEqual(["t-c-7"]);
    expect(ids({ q: "神奈川　福岡" })).toEqual([]);
  });

  it("一致しなければ0件", () => {
    expect(ids({ q: "存在しない語句" })).toEqual([]);
  });

  it("完全一致を部分一致より上位にする", () => {
    const r = ids({ q: "美尻美脚" });
    expect(r.slice(0, 2).sort()).toEqual(["t-v-1", "t-v-2"]);
  });

  it("確認済みを未確認より上位にする（同スコア時）", () => {
    const r = searchRecords(records, { q: "美尻" });
    expect(r[0].record.confidence).toBe("confirmed");
    expect(r[r.length - 1].record.confidence).toBe("unverified");
  });

  it("一致した項目を返す", () => {
    const [hit] = searchRecords(records, { q: "テスト店舗Y" });
    expect(hit.matched).toEqual(["store"]);
  });
});

describe("名称揺れ", () => {
  it("「美尻美脚」で「美尻・美脚」も見つかる（逆も同様）", () => {
    expect(ids({ q: "美尻美脚" }).sort()).toEqual(["t-c-1", "t-v-1", "t-v-2"]);
    expect(ids({ q: "美尻・美脚" }).sort()).toEqual(["t-c-1", "t-v-1", "t-v-2"]);
  });

  it("categoryNormalized で「店長一押し」「店長イチオシ」を相互に検索できる", () => {
    expect(ids({ q: "店長いちおし" }).sort()).toEqual(["t-c-2", "t-v-3"]);
    expect(ids({ q: "イチオシ" }).sort()).toEqual(["t-c-2", "t-v-3"]);
  });

  it("検索で同一視しても原文は変更しない", () => {
    const names = searchRecords(records, { q: "美尻美脚" }).map((h) => h.record.categoryOriginal);
    expect(names).toContain("美尻美脚");
    expect(names).toContain("美尻・美脚");
  });

  it("語順が違う表記は統合しない（かわいいアイドル / アイドル・可愛い）", () => {
    expect(ids({ q: "かわいいアイドル" })).toEqual(["t-c-3"]);
  });
});

describe("フィルター", () => {
  it("都道府県フィルター", () => {
    expect(ids({ pref: "kanagawa" }).sort()).toEqual(["t-c-7", "t-v-1", "t-v-2"]);
    expect(ids({ pref: "okinawa" })).toEqual([]);
  });

  it("都道府県未判明フィルター", () => {
    expect(ids({ pref: "unknown" }).sort()).toEqual(["t-c-3", "t-c-4"]);
  });

  it("エリアフィルター", () => {
    const area = areaIdOf("kanagawa", "テスト市");
    expect(ids({ pref: "kanagawa", area }).sort()).toEqual(["t-c-7", "t-v-1", "t-v-2"]);
    expect(ids({ pref: "osaka", area: "none" })).toEqual(["t-c-1"]);
  });

  it("確認状態・区分フィルター", () => {
    expect(ids({ confidence: "confirmed" }).sort()).toEqual(["t-v-1", "t-v-3"]);
    expect(ids({ dataset: "verified", confidence: "probable" })).toEqual(["t-v-2"]);
    expect(ids({ dataset: "candidate", confidence: "confirmed" })).toEqual([]);
  });

  it("検索語とフィルターを組み合わせる", () => {
    expect(ids({ q: "美尻", pref: "osaka" })).toEqual(["t-c-1"]);
  });
});

describe("地域検索", () => {
  const index = buildPlaceIndex(model);
  it("都道府県・エリアを返す", () => {
    const r = searchPlaces(index, "テスト");
    expect(r.areas.map((a) => a.name).sort()).toEqual(["テスト北", "テスト市"]);
    expect(searchPlaces(index, "大阪").prefectures.map((p) => p.slug)).toEqual(["osaka"]);
  });
  it("データ0件の都道府県も地域として見つかる", () => {
    const [okinawa] = searchPlaces(index, "沖縄").prefectures;
    expect(okinawa.recordCount).toBe(0);
  });
  it("空の検索語では何も返さない", () => {
    expect(searchPlaces(index, "")).toEqual({ prefectures: [], areas: [] });
  });
});

describe("空データ", () => {
  it("レコード0件でも検索できる", () => {
    expect(searchRecords([], { q: "川崎", pref: "kanagawa" })).toEqual([]);
    const empty = buildModel([]);
    expect(searchPlaces(buildPlaceIndex(empty), "川崎")).toEqual({ prefectures: [], areas: [] });
  });
});

describe("地方名の扱い", () => {
  it("都道府県名に一致する語では地方の他県を出さない", () => {
    expect(ids({ q: "沖縄" })).toEqual([]);
    const index = buildPlaceIndex(model);
    expect(searchPlaces(index, "沖縄").prefectures.map((p) => p.slug)).toEqual(["okinawa"]);
  });
  it("地方名では地方内の都道府県が見つかる", () => {
    const index = buildPlaceIndex(model);
    expect(searchPlaces(index, "四国").prefectures.map((p) => p.slug)).toEqual([
      "tokushima",
      "kagawa",
      "ehime",
      "kochi",
    ]);
  });
});
