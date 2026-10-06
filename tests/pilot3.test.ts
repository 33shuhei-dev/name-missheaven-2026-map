import { describe, expect, it } from "vitest";
import { site, phase3b } from "@/lib/data";
import { storeListingAreaUpdates, storeUpdates, sourceUpdates } from "@/data/store-updates";
import { entrantSources, entrantUpdates } from "@/data/entrant-updates";
import { validateStoreListingAreaUpdates } from "@/lib/validate";
import type { Phase3RawSource, Phase3RawStore } from "@/data/types";

/** 3都道府県パイロット（大阪府・宮城県・青森県、2026-10-06）で追加した店舗と掲載地域の補完 */
describe("3都道府県パイロット：店舗", () => {
  const pilot = storeUpdates.filter((s) => s.storeId.startsWith("mh26-pl3-store-"));
  const norm = (s: string) => s.normalize("NFKC").replace(/\s/g, "").toLowerCase();

  it("追加店舗は大阪府・宮城県だけで、どれも情報源・ヘブンの店舗キーと一致する公開ページURLを持つ", () => {
    expect(pilot.length).toBeGreaterThan(0);
    for (const s of pilot) {
      expect(["大阪府", "宮城県"]).toContain(s.prefecture);
      expect(s.sourceIds.length).toBeGreaterThan(0);
      expect(s.storePublicUrl).toBe(`https://www.cityheaven.net/${s.cityheavenKey}/`);
      expect(s.formalElectionArea).toBeNull();
      // 2ページ以上なら probable、1ページなら unverified
      expect(s.confidence).toBe(Number(s.evidencePageCount ?? 0) >= 2 ? "probable" : "unverified");
      for (const sid of s.sourceIds) {
        const src = sourceUpdates.find((x) => x.sourceId === sid)!;
        expect(src.storeIds).toContain(s.storeId);
        expect(src.url).toContain(`/${s.cityheavenKey}/`);
      }
    }
  });

  it("既存の店舗（同じ県・同じ店名、同じ店舗キー）と重複しない", () => {
    const others = site.stores.filter((s) => !s.id.startsWith("mh26-pl3-store-"));
    const keys = new Set(phase3b.stores.map((s) => s.cityheavenKey).filter(Boolean));
    for (const s of pilot) {
      expect(keys.has(s.cityheavenKey)).toBe(false);
      expect(others.some((o) => o.prefecture === s.prefecture && norm(o.name) === norm(s.storeName))).toBe(false);
    }
  });

  it("エススタイルクラブ（宮城県）の掲載地域を補っている（正式選挙エリアは変えない）", () => {
    const s = site.stores.find((x) => x.id === "mh26-p3b-store-3ae81f8f4a771fab")!;
    expect(s.listingAreas).toEqual(["青葉区・国分町"]);
    expect(s.formalElectionArea).toBeUndefined();
  });

  it("掲載地域の補完は、元データに掲載地域がある店舗を上書きしない・根拠が必要", () => {
    const store = { storeId: "x", listingArea: "A", listingAreas: ["A"] } as unknown as Phase3RawStore;
    const src = { sourceId: "s", storeIds: ["x"] } as unknown as Phase3RawSource;
    expect(validateStoreListingAreaUpdates([{ storeId: "x", listingArea: "B", sourceIds: ["s"] }], { stores: [store], sources: [src] })).toHaveLength(1);
    const empty = { ...store, listingArea: null, listingAreas: [] } as unknown as Phase3RawStore;
    expect(validateStoreListingAreaUpdates([{ storeId: "x", listingArea: "B", sourceIds: [] }], { stores: [empty], sources: [src] })).toHaveLength(1);
    expect(validateStoreListingAreaUpdates([{ storeId: "x", listingArea: "B", sourceIds: ["s"] }], { stores: [empty], sources: [src] })).toHaveLength(0);
    expect(storeListingAreaUpdates.some((u) => u.storeId === "mh26-p3b-store-3ae81f8f4a771fab")).toBe(true);
  });
});

describe("3都道府県パイロット：出場者", () => {
  const pilot = entrantUpdates.filter((e) => e.entrantId >= "mh26-ent-2001" && e.entrantId < "mh26-ent-3000");

  it("大阪府・宮城県の店舗に所属し、根拠に2026年（または2026年の日付）と人物名がある", () => {
    expect(pilot.length).toBeGreaterThan(0);
    for (const e of pilot) {
      const store = site.stores.find((s) => s.id === e.storeId)!;
      expect(["大阪府", "宮城県"], e.entrantId).toContain(store.prefectureName);
      expect(e.evidence.includes("2026") || /^2026-/.test(e.evidenceDate ?? ""), e.entrantId).toBe(true);
      expect(e.personalUrl ?? null).toBeNull();
      for (const sid of e.sourceIds) expect(entrantSources.find((s) => s.sourceId === sid)!.storeIds).toContain(e.storeId);
    }
  });

  it("部門は原文どおりで、その店舗の部門として表示される", () => {
    for (const e of pilot.filter((x) => x.categoryOriginal)) {
      const store = site.stores.find((s) => s.id === e.storeId)!;
      expect(store.categoryOriginals, e.entrantId).toContain(e.categoryOriginal);
    }
  });
});
