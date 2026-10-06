import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { entrantSources, entrantUpdates } from "@/data/entrant-updates";
import { storeUpdates } from "@/data/store-updates";

/** 掲載依頼（第三者）を起点に個別追加した出場者：とあまる（ピュアコス学園・茨城県・ソープ部門） */
describe("掲載依頼：とあまる（ピュアコス学園・茨城県・ソープ部門）", () => {
  const items = buildSearchIndex(site);
  const store = site.stores.find((s) => s.name === "ピュアコス学園")!;

  it("店舗は既存の1件に紐づけ、新しい店舗を作っていない。出場者は1件だけ", () => {
    expect(site.stores.filter((s) => s.name === "ピュアコス学園")).toHaveLength(1);
    expect(storeUpdates.some((s) => s.storeName === "ピュアコス学園")).toBe(false);
    expect(site.entrants.filter((e) => e.name === "とあまる")).toHaveLength(1);
    expect(entrantUpdates.filter((e) => e.name === "とあまる")).toHaveLength(1);
    expect(site.entrants.find((e) => e.name === "とあまる")!.storeId).toBe(store.id);
    expect(store.prefectureName).toBe("茨城県");
  });

  it("部門は「ソープ部門」の原文のまま。伏字の「土浦ソ♡プ部門」とは統合していない", () => {
    const rec = entrantUpdates.find((e) => e.name === "とあまる")!;
    expect(rec.categoryOriginal).toBe("ソープ部門");
    expect(store.categories.map((c) => c.categoryOriginal)).toContain("ソープ部門");
    expect(store.categories.map((c) => c.categoryOriginal)).toContain("土浦ソ♡プ部門");
    expect(site.divisions.filter((d) => d.prefSlug === "ibaraki" && d.categoryOriginal === "土浦ソ♡プ部門")).toHaveLength(1);
  });

  it("根拠（本人Xの固定投稿・2026年）と、掲載依頼を起点に追加したことが記録に残る。個人URLは本人Xのみ", () => {
    const rec = entrantUpdates.find((e) => e.name === "とあまる")!;
    expect(rec.evidence).toContain("2026年のミスヘブン総選挙");
    expect(rec.evidence).toContain("ピュアコス学園からソープ部門で出場します");
    expect(rec.personalUrl).toBe("https://x.com/toamaru23");
    expect(rec.notes).toContain("掲載依頼（第三者）を起点に追加");
    for (const sid of rec.sourceIds) {
      const src = entrantSources.find((s) => s.sourceId === sid)!;
      expect(src.url).toBe("https://x.com/toamaru23");
      expect(src.notes).toContain("掲載依頼を起点に追加");
      expect(src.storeIds).toContain(store.id);
    }
  });

  it("「とあまる」の検索で出場者が先頭に出て、ピュアコス学園・茨城県・ソープ部門が分かる", () => {
    const hits = searchItems(items, { q: "とあまる" });
    expect(hits[0].item.kind).toBe("entrant");
    expect(hits[0].item.href.startsWith(`/store/${store.id}`)).toBe(true);
    expect(hits[0].item.prefName).toBe("茨城県");
    expect(hits[0].item.sub).toContain("ピュアコス学園");
    expect(hits[0].item.sub).toContain("ソープ部門");
  });

  it("茨城県・「ソープ部門」から辿れる", () => {
    expect(searchItems(items, { q: "とあまる", pref: "ibaraki" }).some((h) => h.item.kind === "entrant")).toBe(true);
    const div = site.divisions.find((d) => d.prefSlug === "ibaraki" && d.categoryOriginal === "ソープ部門");
    expect(div?.stores.some((s) => s.id === store.id)).toBe(true);
  });

  it("既存の出場者（ゆず・恋仲めい・ピュアコス学園の既存の出場者）に影響しない", () => {
    expect(searchItems(items, { q: "ゆず" })[0].item.kind).toBe("entrant");
    expect(searchItems(items, { q: "恋仲めい" })[0].item.href).toContain("mh26-upd-store-0002");
    const names = site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name).sort();
    expect(names).toEqual(["アスナ", "ひまり", "ララ", "とあまる"].sort());
  });
});
