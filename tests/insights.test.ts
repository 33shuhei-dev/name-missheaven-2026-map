import { describe, expect, it } from "vitest";
import { buildModel } from "@/lib/model";
import { categoriesOnlyIn, categorySpread, prefecturesByCoverage } from "@/lib/insights";
import { model } from "./fixtures";

describe("全国比較（将来の発見機能用）", () => {
  it("部門名ごとの分布を、分布の狭い順に返す", () => {
    const spread = categorySpread(model);
    const bijiri = spread.find((c) => c.name === "美尻美脚部門")!;
    expect(bijiri.prefSlugs).toEqual(["kanagawa"]);
    const idol = spread.find((c) => c.name === "かわいいアイドル部門")!;
    expect(idol.prefSlugs).toEqual([]);
    expect(idol.hasUnknownPrefecture).toBe(true);
    for (let i = 1; i < spread.length; i++) {
      expect(spread[i - 1].prefSlugs.length).toBeLessThanOrEqual(spread[i].prefSlugs.length);
    }
  });
  it("その県だけで見つかっている部門名", () => {
    expect(categoriesOnlyIn(model, "kanagawa").map((c) => c.name)).toEqual(["美尻美脚部門"]);
    expect(categoriesOnlyIn(model, "okinawa")).toEqual([]);
  });
  it("情報の少ない県から並べる", () => {
    const list = prefecturesByCoverage(model);
    expect(list).toHaveLength(47);
    expect(list[0].recordCount).toBe(0);
    expect(list[list.length - 1].recordCount).toBe(2);
  });
  it("空データでも動く", () => {
    expect(categorySpread(buildModel([]))).toEqual([]);
  });
});
