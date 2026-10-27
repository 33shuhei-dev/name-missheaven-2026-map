import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { entrantUpdates } from "@/data/entrant-updates";

/** 掲載依頼（第三者）を起点に追加：恋羽(こはね)（ラブローズ 岩手・岩手県・岩手デリヘル部門） */
describe("掲載依頼：恋羽(こはね)（ラブローズ 岩手・岩手県・岩手デリヘル部門）", () => {
  const CAT = "岩手デリヘル部門";
  const store = site.stores.find((s) => s.id === "mh26-upd-store-0004")!;
  const items = buildSearchIndex(site);

  it("店舗・出場者は1件ずつ（重複なし）。岩手県、公開ページURLは在籍ページの店舗部分", () => {
    expect(site.stores.filter((s) => s.name === "ラブローズ 岩手")).toHaveLength(1);
    expect(site.entrants.filter((e) => e.storeId === store.id)).toHaveLength(1);
    expect(store.prefectureName).toBe("岩手県");
    expect(store.storePublicUrl).toBe("https://www.cityheaven.net/iwate/A0302/A030201/loverose/");
  });

  it("部門はバッジの表記どおり「岩手デリヘル部門」（依頼文の「デリヘル部門」とは統合しない）", () => {
    expect(store.categoryOriginals).toContain(CAT);
    expect(entrantUpdates.find((e) => e.entrantId === "mh26-ent-0028")!.categoryOriginal).toBe(CAT);
  });

  it("「恋羽」「こはね」「ラブローズ」の検索で辿れる", () => {
    for (const q of ["恋羽", "こはね"]) expect(searchItems(items, { q }).some((h) => h.item.kind === "entrant" && h.item.href.startsWith(`/store/${store.id}`)), q).toBe(true);
    expect(searchItems(items, { q: "ラブローズ", kind: "store" }).some((h) => h.item.href === `/store/${store.id}`)).toBe(true);
    expect(searchItems(items, { q: "LoveRose", kind: "store" }).some((h) => h.item.href === `/store/${store.id}`)).toBe(true);
  });
});
