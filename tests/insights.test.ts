import { describe, expect, it } from "vitest";
import { buildModel, findPrefectureView, summarize, toRecords } from "@/lib/model";
import { categoriesOnlyIn, categorySpread, prefecturesByCoverage } from "@/lib/insights";
import { fixtureSets } from "./fixtures";

const records = toRecords(fixtureSets);
const model = buildModel(records);

describe("都道府県ごとの集計（将来の全国マップ用）", () => {
  it("情報件数・部門数・エリア数・出場者数・店舗数・確認状態別件数を持つ", () => {
    const s = findPrefectureView(model, "kanagawa")!.summary;
    expect(s.recordCount).toBe(3);
    expect(s.divisionCount).toBe(2);
    expect(s.areaCount).toBe(1);
    expect(s.entrantCount).toBe(3);
    expect(s.storeCount).toBe(1);
    expect(s.byConfidence).toEqual({ confirmed: 1, probable: 2, unverified: 0 });
    expect(s.byDataset).toEqual({ verified: 2, candidate: 1 });
    expect(s.lastCheckedAt).toBe("2026-09-15");
  });

  it("エリア別件数はエリア一覧から取れる", () => {
    const osaka = findPrefectureView(model, "osaka")!;
    expect(osaka.areas.map((a) => [a.label, a.recordCount])).toEqual([
      ["テスト北", 1],
      ["エリア未判明", 1],
    ]);
  });

  it("データ0件の県も0で集計される", () => {
    const s = findPrefectureView(model, "okinawa")!.summary;
    expect(s.recordCount).toBe(0);
    expect(s.divisionCount).toBe(0);
    expect(s.lastCheckedAt).toBeNull();
  });

  it("都道府県の集計の合計は全国と一致する", () => {
    const all = [...model.prefectures, model.unknownPrefecture!];
    expect(all.reduce((n, p) => n + p.summary.recordCount, 0)).toBe(model.stats.recordCount);
    expect(all.reduce((n, p) => n + p.summary.divisionCount, 0)).toBe(model.stats.divisionCount);
  });

  it("全国の集計も同じ関数で求めている", () => {
    const { prefectureWithDataCount, prefectureTotal, ...rest } = model.stats;
    expect(rest).toEqual(summarize(records));
    expect(prefectureWithDataCount).toBe(5);
    expect(prefectureTotal).toBe(47);
  });
});

describe("全国比較", () => {
  it("部門名ごとの分布を、分布の狭い順に返す", () => {
    const spread = categorySpread(model);
    const bijiri = spread.find((c) => c.name === "美尻美脚")!;
    expect(bijiri.prefSlugs).toEqual(["kanagawa"]);
    expect(bijiri.hasUnknownPrefecture).toBe(false);
    const idol = spread.find((c) => c.name === "かわいいアイドル")!;
    expect(idol.prefSlugs).toEqual([]);
    expect(idol.hasUnknownPrefecture).toBe(true);
    for (let i = 1; i < spread.length; i++) {
      expect(spread[i - 1].prefSlugs.length).toBeLessThanOrEqual(spread[i].prefSlugs.length);
    }
  });

  it("その県だけで確認されている部門名", () => {
    expect(categoriesOnlyIn(model, "kanagawa").map((c) => c.name).sort()).toEqual(
      ["コスプレ", "美尻美脚"].sort(),
    );
    expect(categoriesOnlyIn(model, "okinawa")).toEqual([]);
  });

  it("情報の少ない県から並べる", () => {
    const list = prefecturesByCoverage(model);
    expect(list).toHaveLength(47);
    expect(list[0].recordCount).toBe(0);
    expect(list[list.length - 1].slug).toBe("kanagawa");
  });

  it("空データでも動く", () => {
    const empty = buildModel([]);
    expect(categorySpread(empty)).toEqual([]);
    expect(prefecturesByCoverage(empty)[0].summary.recordCount).toBe(0);
  });
});
