import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { buildModel } from "@/lib/model";
import type { SiteRelation, SiteStore } from "@/data/types";

/**
 * 店舗×部門関係の根拠に書かれた出場者名（entrantNames）が検索できること。
 * 実データ：神奈川県・厚木の abc＋（差分更新）の告知バナーに「デリヘル部門 ゆず NOMINATION」
 */
describe("検索：根拠に書かれた出場者名と店舗（abc＋ / ゆず / 厚木）", () => {
  const items = buildSearchIndex(site);
  const find = (q: string) => searchItems(items, { q }).map((h) => h.item);
  const store = site.stores.find((s) => s.name === "abc＋")!;

  it("前提：abc＋ は神奈川県・厚木の店舗として登録されている", () => {
    expect(store).toBeTruthy();
    expect(store.prefectureName).toBe("神奈川県");
    expect(store.listingAreas).toEqual(["厚木"]);
  });

  it("「ゆず」で出場者がヒットし、店舗 abc＋・神奈川県 / 厚木 と分かり、店舗ページへ進める", () => {
    const hit = find("ゆず").find((i) => i.kind === "entrant" && i.name === "ゆず" && i.prefName === "神奈川県");
    expect(hit).toBeTruthy();
    expect(hit!.sub).toContain("店舗：abc＋");
    expect(hit!.sub).toContain("デリヘル部門");
    expect(hit!.listingArea).toBe("厚木");
    expect(hit!.href.startsWith(`/store/${store.id}#`)).toBe(true);
  });

  it("「ユズ」（カタカナ）でもヒットする", () => {
    expect(find("ユズ").some((i) => i.kind === "entrant" && i.href.startsWith(`/store/${store.id}#`))).toBe(true);
  });

  for (const q of ["abc＋", "abc+", "ABC＋", "ａｂｃ＋"]) {
    it(`「${q}」で店舗 abc＋ が上位に出る`, () => {
      const hits = find(q);
      const idx = hits.findIndex((i) => i.kind === "store" && i.id === store.id);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(5);
    });
  }

  it("「厚木」で掲載地域・店舗・出場者に辿れる", () => {
    const hits = find("厚木");
    expect(hits.some((i) => i.kind === "area" && i.name === "厚木")).toBe(true);
    expect(hits.some((i) => i.kind === "store" && i.id === store.id)).toBe(true);
    expect(hits.some((i) => i.kind === "entrant" && i.name === "ゆず")).toBe(true);
  });

  for (const q of ["厚木 ゆず", "abc＋ ゆず", "abc+ ゆず", "神奈川 ゆず"]) {
    it(`「${q}」で ゆず（abc＋）が先頭に出る`, () => {
      const top = find(q)[0];
      expect(top.kind).toBe("entrant");
      expect(top.name).toBe("ゆず");
      expect(top.href.startsWith(`/store/${store.id}#`)).toBe(true);
    });
  }

  it("店舗ページの出場者一覧に表示され、アンカーが一致する", () => {
    const e = site.entrants.find((x) => x.storeId === store.id && x.name === "ゆず")!;
    expect(e).toBeTruthy();
    expect(e.divisions.map((d) => d.categoryOriginal)).toEqual(["デリヘル部門"]);
    expect(e.confidence).toBe("probable");
  });
});

describe("店舗×部門関係の出場者名（汎用の仕組み）", () => {
  const st = (id: string, name: string): SiteStore => ({
    id, origin: "update", name, nameOriginals: [name], prefecture: "愛媛県", listingAreas: ["松山"], categoryOriginals: ["テスト部門"],
    sourceType: "store", confidence: "probable", participationType: "store_banner_reported", isNewSincePhase1: true,
    phase1RecordIds: [], sourceIds: ["s1"],
  } as SiteStore);
  const rel = (storeId: string, names?: string[]): SiteRelation => ({
    id: `r-${storeId}`, storeId, categoryOriginal: "テスト部門", confidence: "unverified", sourceIds: ["s1"], phase1RecordIds: [], entrantNames: names,
  });

  it("entrantNames のある関係から出場者ができ、ない関係からはできない", () => {
    const model = buildModel([], { layer: { stores: [st("a", "店A"), st("b", "店B")], relations: [rel("a", ["はな"]), rel("b")], sources: [], countFacts: [] } });
    expect(model.entrants.map((e) => [e.name, e.storeId])).toEqual([["はな", "a"]]);
    expect(model.entrants[0].confidence).toBe("unverified");
    expect(model.entrants[0].divisions).toHaveLength(1);
    const hits = searchItems(buildSearchIndex(model), { q: "松山 はな" });
    expect(hits[0].item.kind).toBe("entrant");
  });
});
