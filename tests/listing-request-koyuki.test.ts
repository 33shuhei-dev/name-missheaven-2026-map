import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { entrantUpdates } from "@/data/entrant-updates";

/** 出場者本人からの掲載依頼（DM）で追加し、後日ノミネートのバッジ（スクリーンショット）で確認：こゆき（秋葉原コスプレ学園IN西川口・埼玉県・ヘルス部門） */
describe("掲載依頼（本人）：こゆき（秋葉原コスプレ学園IN西川口・埼玉県・ヘルス部門）", () => {
  const store = site.stores.find((s) => s.id === "mh26-upd-store-0006")!;
  const items = buildSearchIndex(site);

  it("店舗・出場者は1件ずつ。東京都の「秋葉原コスプレ学園」とは別の店舗。埼玉県、公開ページURLは在籍ページの店舗部分", () => {
    expect(site.stores.filter((s) => s.name === "秋葉原コスプレ学園IN西川口")).toHaveLength(1);
    expect(site.stores.filter((s) => s.name === "秋葉原コスプレ学園" && s.id !== store.id).every((s) => s.prefectureName !== "埼玉県")).toBe(true);
    expect(site.entrants.filter((e) => e.storeId === store.id)).toHaveLength(1);
    expect(store.prefectureName).toBe("埼玉県");
    expect(store.storePublicUrl).toBe("https://www.cityheaven.net/saitama/A1102/A110201/akikosu/");
  });

  it("ノミネートのバッジで確認した記録（probable）。部門はバッジの表記どおり", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0030")!;
    expect(rec.confidence).toBe("probable");
    expect(rec.evidence).toContain("ノミネート」のバッジ");
    expect(rec.evidence).toContain("全国ミスヘブン総選挙2026");
    expect(rec.categoryOriginal).toBe("ヘルス部門");
    expect(store.categoryOriginals).toContain("ヘルス部門");
  });

  it("「こゆき」「秋葉原コスプレ学園」の検索で辿れる", () => {
    expect(searchItems(items, { q: "こゆき", pref: "saitama" }).some((h) => h.item.kind === "entrant" && h.item.href.startsWith(`/store/${store.id}`))).toBe(true);
    expect(searchItems(items, { q: "秋葉原コスプレ学園IN西川口", kind: "store" }).some((h) => h.item.href === `/store/${store.id}`)).toBe(true);
  });
});
