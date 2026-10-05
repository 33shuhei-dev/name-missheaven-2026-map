import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { featuredCategories, summarizeCategories } from "@/lib/categories";

/** トップの「こんな部門まである」・部門一覧の集計。実データの部門名だけを使い、数字を合算で作らない */
describe("部門の探索用の集計", () => {
  const all = summarizeCategories(site);

  it("部門名（原文）の数は全国集計と一致する", () => {
    expect(all).toHaveLength(site.stats.allCategoryNameCount);
  });

  it("トップに出す部門はすべて実データの部門名で、店舗があり、リンク先が存在する", () => {
    const featured = featuredCategories(all);
    expect(featured.length).toBeGreaterThanOrEqual(6);
    const names = new Set(site.divisions.map((d) => d.categoryOriginal));
    const divisionIds = new Set(site.divisions.map((d) => d.id));
    for (const c of featured) {
      expect(names.has(c.name), c.name).toBe(true);
      expect(c.storeCount, c.name).toBeGreaterThan(0);
      if (c.href.startsWith("/division/")) expect(divisionIds.has(c.href.slice("/division/".length)), c.href).toBe(true);
      else expect(c.href).toBe(`/categories?q=${encodeURIComponent(c.name)}`);
    }
    expect(new Set(featured.map((c) => c.name)).size).toBe(featured.length);
  });

  it("店舗数は店舗IDの重複なし、都道府県数は地域未判明を数えない", () => {
    for (const c of all) {
      const divisions = site.divisions.filter((d) => d.categoryOriginal === c.name);
      expect(c.storeCount).toBe(new Set(divisions.flatMap((d) => d.stores.map((s) => s.id))).size);
      expect(c.prefectureCount).toBe(new Set(divisions.map((d) => d.prefSlug).filter((s) => s !== "unknown")).size);
    }
  });
});
