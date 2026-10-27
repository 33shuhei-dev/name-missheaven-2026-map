import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { entrantUpdates } from "@/data/entrant-updates";

/** 掲載依頼（第三者）を起点に追加：のあ（カナーズ 岐阜本店・岐阜県・ソープ部門）。ノミネートのバッジは未確認なので unverified */
describe("掲載依頼：のあ（カナーズ 岐阜本店・岐阜県・ソープ部門）", () => {
  const store = site.stores.find((s) => s.id === "mh26-upd-store-0005")!;
  const items = buildSearchIndex(site);

  it("店舗・出場者は1件ずつ（重複なし）。岐阜県、公開ページURLは在籍ページの店舗部分", () => {
    expect(site.stores.filter((s) => s.name === "カナーズ 岐阜本店")).toHaveLength(1);
    expect(site.entrants.filter((e) => e.storeId === store.id)).toHaveLength(1);
    expect(store.prefectureName).toBe("岐阜県");
    expect(store.storePublicUrl).toBe("https://www.cityheaven.net/gifu/A2101/A210101/yakata/");
  });

  it("確認の弱さを記録している：unverified、年の表記がないこと、ノミネートのバッジ未確認", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0029")!;
    expect(rec.confidence).toBe("unverified");
    expect(rec.evidenceDate).toBe("2026-10-23");
    expect(rec.evidence).toContain("年の表記はなく");
    expect(rec.notes).toContain("ノミネートのバッジは未確認");
    expect(rec.categoryOriginal).toBe("ソープ部門");
  });

  it("「のあ」「カナーズ」「ガナーズ」「KANAAAAZ」の検索で辿れる", () => {
    expect(searchItems(items, { q: "のあ", pref: "gifu" }).some((h) => h.item.kind === "entrant" && h.item.href.startsWith(`/store/${store.id}`))).toBe(true);
    for (const q of ["カナーズ", "ガナーズ", "KANAAAAZ"]) expect(searchItems(items, { q, kind: "store" }).some((h) => h.item.href === `/store/${store.id}`), q).toBe(true);
  });
});
