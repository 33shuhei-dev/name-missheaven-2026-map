import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { entrantSources, entrantUpdates } from "@/data/entrant-updates";
import { storeUpdates } from "@/data/store-updates";
import { participationStatusText } from "@/lib/labels";

/** 本人申請を起点に個別追加した出場者（いろは / THEOBROMA / 熊本県 / ビジュアル部門） */
describe("本人申請：いろは（THEOBROMA・熊本県・ビジュアル部門）", () => {
  const CAT = "ビジュアル部門";
  const items = buildSearchIndex(site);
  const store = site.stores.find((s) => s.name === "THEOBROMA")!;

  it("店舗・出場者は1件ずつだけ登録されている（重複なし）", () => {
    expect(site.stores.filter((s) => s.name === "THEOBROMA")).toHaveLength(1);
    expect(site.entrants.filter((e) => e.storeId === store.id && e.name === "いろは")).toHaveLength(1);
    expect(entrantUpdates.filter((e) => e.storeId === "mh26-upd-store-0003")).toHaveLength(1);
  });

  it("店舗は熊本県。公開ページURLは本人提供の在籍ページURLの店舗部分。掲載地域・正式選挙エリアは未設定", () => {
    expect(store.prefectureName).toBe("熊本県");
    expect(store.storePublicUrl).toBe("https://www.cityheaven.net/kumamoto/A4301/A430102/theobroma/");
    expect(store.listingAreas).toEqual([]);
    expect(store.formalElectionArea).toBeUndefined();
    expect(participationStatusText(store)).toContain("本人からの掲載申請");
  });

  it("出場者は店舗に紐づき、部門は原文のまま。本人申請を起点に追加したことが記録に残る", () => {
    const rec = entrantUpdates.find((x) => x.entrantId === "mh26-ent-0027")!;
    expect(rec.categoryOriginal).toBe(CAT);
    expect(rec.evidence).toContain("2026");
    expect(rec.notes).toContain("本人申請を起点に追加");
    for (const sid of rec.sourceIds) expect(entrantSources.find((s) => s.sourceId === sid)!.notes).toContain("本人申請を起点に追加");
    expect(storeUpdates.find((s) => s.storeId === "mh26-upd-store-0003")!.notes).toContain("本人申請を起点に追加");
    expect(store.categoryOriginals).toContain(CAT);
  });

  it("「いろは」の検索で熊本県の出場者が出て、店舗ページへ進める。店舗名・部門からも辿れる", () => {
    const hits = searchItems(items, { q: "いろは", pref: "kumamoto" });
    expect(hits.some((h) => h.item.kind === "entrant" && h.item.href.startsWith(`/store/${store.id}`))).toBe(true);
    expect(searchItems(items, { q: "THEOBROMA", kind: "store" }).some((h) => h.item.href === `/store/${store.id}`)).toBe(true);
    expect(searchItems(items, { q: CAT, kind: "division" }).length).toBeGreaterThan(0);
  });
});
