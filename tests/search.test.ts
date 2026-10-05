import { describe, expect, it } from "vitest";
import { buildModel } from "@/lib/model";
import { buildSearchIndex, searchItems, type SearchFilters } from "@/lib/search";
import { modelWithStores as model } from "./fixtures";

const items = buildSearchIndex(model);
const find = (f: SearchFilters) => searchItems(items, f).map((h) => `${h.item.kind}:${h.item.name}`);

describe("検索インデックス", () => {
  it("都道府県（47＋地域未判明）・掲載地域・部門・店舗・出場者を含む", () => {
    const count = (k: string) => items.filter((i) => i.kind === k).length;
    expect(count("prefecture")).toBe(48);
    expect(count("area")).toBe(4);
    expect(count("division")).toBe(model.divisions.length);
    expect(count("store")).toBe(4);
    expect(count("entrant")).toBe(4);
  });
  it("各項目に遷移先・都道府県・確認状態がある", () => {
    for (const i of items) {
      expect(i.href).toMatch(/^\//);
      expect(i.prefName).toBeTruthy();
      if (i.kind === "prefecture" && i.prefSlug !== "unknown") expect(i.status).toBeTruthy();
      if (i.kind === "division" || i.kind === "store" || i.kind === "entrant") expect(i.confidence).toBeTruthy();
    }
  });
});

describe("全国横断検索", () => {
  it("都道府県名（部分一致）で検索できる", () => {
    expect(find({ q: "神奈川", kind: "prefecture" })).toEqual(["prefecture:神奈川県"]);
  });
  it("地方名で都道府県が見つかる。都道府県名に一致する語では他県を出さない", () => {
    expect(find({ q: "四国", kind: "prefecture" })).toHaveLength(4);
    expect(find({ q: "沖縄", kind: "prefecture" })).toEqual(["prefecture:沖縄県"]);
  });
  it("掲載地域名で検索できる", () => {
    expect(find({ q: "テスト北", kind: "area" })).toEqual(["area:テスト北"]);
  });
  it("部門名で検索できる", () => {
    expect(find({ q: "アイドル", kind: "division" }).sort()).toEqual([
      "division:かわいいアイドル部門",
      "division:アイドル・可愛い部門",
    ]);
  });
  it("店舗名（表記揺れの原文も）・出場者名で検索できる", () => {
    expect(find({ q: "テスト店舗 X", kind: "store" })).toEqual(["store:テスト店舗X"]);
    expect(find({ q: "テスト県不明", kind: "store" })).toEqual(["store:テスト県不明店"]);
    expect(find({ q: "テスト店舗Y", kind: "store" })).toEqual(["store:テスト店舗Y"]);
    expect(find({ q: "テスト出場者B", kind: "entrant" })).toEqual(["entrant:テスト出場者B"]);
  });
  it("名称の一致を関連情報の一致より上位にする", () => {
    const r = find({ q: "テスト店舗X" });
    expect(r[0]).toBe("store:テスト店舗X");
    expect(r).toContain("division:美尻美脚部門");
  });
  it("空白区切りは AND", () => {
    expect(find({ q: "神奈川 美尻", kind: "division" })).toEqual(["division:美尻美脚部門"]);
    expect(find({ q: "神奈川 コスプレ" })).toEqual([]);
  });
  it("一致しなければ0件", () => {
    expect(find({ q: "存在しない語句" })).toEqual([]);
  });
});

describe("表記揺れ", () => {
  it("記号の違いを吸収する（美尻美脚 ⇔ 美尻・美脚）", () => {
    expect(find({ q: "美尻美脚", kind: "division" }).sort()).toEqual(["division:美尻・美脚部門", "division:美尻美脚部門"]);
    expect(find({ q: "美尻・美脚", kind: "division" }).sort()).toEqual(["division:美尻・美脚部門", "division:美尻美脚部門"]);
  });
  it("絵文字付きの部門名も見つかり、表示名は原文のまま", () => {
    expect(find({ q: "コスプレ部門", kind: "division" })).toEqual(["division:コスプレ部門🎀"]);
    expect(find({ q: "こすぷれ", kind: "division" })).toEqual(["division:コスプレ部門🎀"]);
  });
  it("語順の違う名前は一致させない", () => {
    expect(find({ q: "かわいいアイドル", kind: "division" })).toEqual(["division:かわいいアイドル部門"]);
  });
});

describe("フィルター", () => {
  it("都道府県", () => {
    expect(find({ pref: "kanagawa", kind: "division" })).toEqual(["division:美尻美脚部門"]);
    expect(find({ pref: "okinawa" })).toEqual(["prefecture:沖縄県"]);
    expect(find({ pref: "ehime", kind: "store" })).toEqual(["store:テスト新店舗"]);
  });
  it("地域未判明", () => {
    expect(find({ pref: "unknown", kind: "division" }).sort()).toEqual([
      "division:かわいいアイドル部門",
      "division:アイドル・可愛い部門",
    ]);
  });
  it("掲載地域", () => {
    const area = items.find((i) => i.kind === "area" && i.name === "テスト市")!;
    const r = searchItems(items, { area: area.areaIds[0] }).map((h) => `${h.item.kind}:${h.item.name}`);
    expect(r.sort()).toEqual(
      ["area:テスト市", "division:美尻美脚部門", "entrant:テスト出場者A", "entrant:テスト出場者B", "entrant:テスト出場者C", "store:テスト店舗X"].sort(),
    );
  });
  it("店舗の掲載地域フィルター・部門未確認の店舗", () => {
    const area = items.find((i) => i.kind === "area" && i.name === "テスト温泉")!;
    expect(searchItems(items, { area: area.areaIds[0] }).map((h) => h.item.name).sort()).toEqual(["テスト新店舗", "テスト温泉"].sort());
    expect(items.find((i) => i.kind === "store" && i.name === "テスト新店舗")!.sub).toBe("部門未確認");
  });
  it("検索インデックスに根拠URL・notes を入れない", () => {
    const json = JSON.stringify(items);
    expect(json).not.toContain("https://");
  });
  it("確認状態", () => {
    expect(find({ confidence: "confirmed", kind: "division" })).toEqual(["division:美尻美脚部門"]);
    expect(find({ confidence: "probable", kind: "division" })).toEqual(["division:テスト部門"]);
  });
});

describe("空データ", () => {
  it("レコード0件でも都道府県は検索できる", () => {
    const empty = buildSearchIndex(buildModel([]));
    expect(searchItems(empty, { q: "川崎" })).toEqual([]);
    expect(searchItems(empty, { q: "東京" }).map((h) => h.item.name)).toEqual(["東京都"]);
  });
});
