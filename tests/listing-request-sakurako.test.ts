import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { entrantUpdates } from "@/data/entrant-updates";

/** 掲載依頼（本人）：さくらこ（神栖レッドダイヤ・茨城県・デリヘル部門）。既存店舗に人物と部門を追加し、店舗の公開ページURLを補う */
describe("掲載依頼（本人）：さくらこ（神栖レッドダイヤ・茨城県・デリヘル部門）", () => {
  const store = site.stores.find((s) => s.id === "mh26-sns-store-a38f659d81dbfcd3")!;
  const items = buildSearchIndex(site);

  it("店舗は1件のまま（重複なし）。出場者は店舗に紐づく。茨城県、公開ページURLは在籍ページの店舗部分", () => {
    expect(site.stores.filter((s) => s.name === "神栖レッドダイヤ")).toHaveLength(1);
    expect(site.entrants.filter((e) => e.storeId === store.id && e.name === "さくらこ")).toHaveLength(1);
    expect(store.prefectureName).toBe("茨城県");
    expect(store.storePublicUrl).toBe("https://www.cityheaven.net/ibaraki/A0804/A080401/reddiamond/");
  });

  it("部門はバッジの表記どおり「デリヘル部門」。バッジで確認した記録（probable）", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0031")!;
    expect(rec.categoryOriginal).toBe("デリヘル部門");
    expect(rec.confidence).toBe("probable");
    expect(rec.evidence).toContain("ノミネート」のバッジ");
    expect(store.categoryOriginals).toContain("デリヘル部門");
  });

  it("「さくらこ」の検索で茨城県の出場者として辿れる。既存の出場者も残っている", () => {
    expect(searchItems(items, { q: "さくらこ", pref: "ibaraki" }).some((h) => h.item.kind === "entrant" && h.item.href.startsWith(`/store/${store.id}`))).toBe(true);
    expect(site.entrants.filter((e) => e.storeId === store.id).length).toBeGreaterThanOrEqual(2);
  });
});
