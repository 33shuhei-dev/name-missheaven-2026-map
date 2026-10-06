import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { entrantSources, entrantUpdates } from "@/data/entrant-updates";
import { sourceUpdates, storeUpdates } from "@/data/store-updates";

/** 本人申請を起点に個別追加した出場者（恋仲めい / AMOR-アモル- / 福岡県 / 福岡県フリースタイル部門） */
describe("本人申請：恋仲めい（AMOR-アモル-・福岡県・福岡県フリースタイル部門）", () => {
  const CAT = "福岡県フリースタイル部門";
  const items = buildSearchIndex(site);
  const store = site.stores.find((s) => s.name === "AMOR-アモル-")!;

  it("店舗・出場者は1件ずつだけ登録されている（重複なし）", () => {
    expect(site.stores.filter((s) => s.name === "AMOR-アモル-")).toHaveLength(1);
    expect(site.entrants.filter((e) => e.name === "恋仲めい")).toHaveLength(1);
    expect(entrantUpdates.filter((e) => e.name === "恋仲めい")).toHaveLength(1);
    expect(storeUpdates.filter((s) => s.storeName === "AMOR-アモル-")).toHaveLength(1);
  });

  it("店舗は福岡県。掲載地域・公開ページURL・正式選挙エリアは推測せず未設定", () => {
    expect(store.prefectureName).toBe("福岡県");
    expect(store.listingAreas).toEqual([]);
    expect(store.storePublicUrl).toBeUndefined();
    expect(store.formalElectionArea).toBeUndefined();
  });

  it("出場者は店舗に紐づき、部門は原文のまま、本人Xは個人URL（任意項目）として記録している", () => {
    const e = site.entrants.find((x) => x.name === "恋仲めい")!;
    expect(e.storeId).toBe(store.id);
    const rec = entrantUpdates.find((x) => x.name === "恋仲めい")!;
    expect(rec.categoryOriginal).toBe(CAT);
    expect(rec.personalUrl).toBe("https://x.com/princess1224mei");
    expect(rec.evidence).toContain("2026年10月6日");
    expect(rec.evidence).toContain("『福岡県フリースタイル部門』で出場します");
  });

  it("本人申請を起点に追加したことが、記録・情報源・店舗に残っている", () => {
    const rec = entrantUpdates.find((x) => x.name === "恋仲めい")!;
    expect(rec.notes).toContain("本人申請を起点に追加");
    for (const sid of rec.sourceIds) expect(entrantSources.find((s) => s.sourceId === sid)!.notes).toContain("本人申請を起点に追加");
    expect(storeUpdates.find((s) => s.storeName === "AMOR-アモル-")!.notes).toContain("本人申請を起点に追加");
    expect(sourceUpdates.find((s) => s.storeIds.includes(store.id))!.notes).toContain("本人申請を起点に追加");
  });

  it("「恋仲めい」の検索で出場者が先頭に出て、店舗ページへ進める", () => {
    const hits = searchItems(items, { q: "恋仲めい" });
    expect(hits[0].item.kind).toBe("entrant");
    expect(hits[0].item.href.startsWith(`/store/${store.id}`)).toBe(true);
    expect(hits[0].item.prefName).toBe("福岡県");
    expect(hits[0].item.sub).toContain("AMOR-アモル-");
    expect(hits[0].item.sub).toContain(CAT);
  });

  it("店舗名・福岡県・部門名の検索からも辿れる", () => {
    expect(searchItems(items, { q: "AMOR-アモル-", kind: "store" }).some((h) => h.item.href === `/store/${store.id}`)).toBe(true);
    expect(searchItems(items, { q: "恋仲めい", pref: "fukuoka" }).some((h) => h.item.kind === "entrant")).toBe(true);
    expect(searchItems(items, { q: CAT, kind: "division" }).length).toBeGreaterThan(0);
  });

  it("福岡県の「福岡県フリースタイル部門」に店舗が入り、店舗の部門にも原文のまま出る（別名に統合しない）", () => {
    const divs = site.divisions.filter((d) => d.categoryOriginal === CAT && d.prefSlug === "fukuoka");
    expect(divs.length).toBeGreaterThan(0);
    expect(divs.some((d) => d.stores.some((s) => s.id === store.id))).toBe(true);
    expect(store.categories.map((c) => c.categoryOriginal)).toEqual([CAT]);
    expect(site.categories.flatMap((g) => g.names.map((n) => n.name)).filter((n) => n === CAT)).toHaveLength(1);
  });
});
