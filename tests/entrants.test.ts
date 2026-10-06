import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { buildModel } from "@/lib/model";
import { validateEntrantRecords } from "@/lib/validate";
import { adaptEntrantRecord } from "@/lib/phase3";
import { entrantUpdates } from "@/data/entrant-updates";
import type { EntrantRawRecord, Phase3RawRelation, Phase3RawSource, Phase3RawStore, SiteRelation, SiteStore } from "@/data/types";

/**
 * 出場者の検索（推しから探す）。
 * 回帰基準：神奈川県・厚木の abc＋ の告知バナーに「デリヘル部門 ゆず NOMINATION」（data/entrant-updates.ts）
 */
describe("推しから探す：ゆず（abc＋ / 神奈川県 / 厚木 / デリヘル部門）", () => {
  const items = buildSearchIndex(site);
  const find = (q: string) => searchItems(items, { q }).map((h) => h.item);
  const store = site.stores.find((s) => s.name === "abc＋")!;

  it("前提：abc＋ は神奈川県・厚木の店舗、ゆずは出場者の記録として登録されている", () => {
    expect(store.prefectureName).toBe("神奈川県");
    expect(store.listingAreas).toEqual(["厚木"]);
    const rec = entrantUpdates.find((e) => e.name === "ゆず")!;
    expect(rec.storeId).toBe(store.id);
    expect(rec.personalUrl ?? null).toBeNull(); // 個人URLなしでも記録できる
  });

  it("「ゆず」で 誰・どの店舗・どの地域・どの部門 が分かる結果が先頭に出て、店舗ページへ進める", () => {
    const top = find("ゆず")[0];
    expect(top.kind).toBe("entrant");
    expect(top.name).toBe("ゆず");
    expect(top.prefName).toBe("神奈川県");
    expect(top.listingArea).toBe("厚木");
    expect(top.sub).toBe("店舗：abc＋ ・ デリヘル部門");
    expect(top.href.startsWith(`/store/${store.id}#`)).toBe(true);
  });

  for (const q of ["ユズ", "abc＋ ゆず", "abc+ ゆず", "ABC＋ ゆず", "厚木 ゆず", "神奈川 ゆず", "デリヘル ゆず"]) {
    it(`「${q}」で ゆず（abc＋）が先頭に出る`, () => {
      const top = find(q)[0];
      expect(top.kind).toBe("entrant");
      expect(top.name).toBe("ゆず");
      expect(top.href.startsWith(`/store/${store.id}#`)).toBe(true);
    });
  }

  for (const q of ["abc＋", "abc+", "ABC＋", "ａｂｃ＋"]) {
    it(`「${q}」で店舗 abc＋ が先頭に出る`, () => {
      const top = find(q)[0];
      expect(top.kind).toBe("store");
      expect(top.id).toBe(store.id);
    });
  }

  it("「厚木」で掲載地域・店舗・出場者に辿れる", () => {
    const hits = find("厚木");
    expect(hits[0].kind).toBe("area");
    expect(hits.some((i) => i.kind === "store" && i.id === store.id)).toBe(true);
    expect(hits.some((i) => i.kind === "entrant" && i.name === "ゆず")).toBe(true);
  });

  it("店舗ページの出場者として表示され、部門・確認状態は記録どおり", () => {
    const e = site.entrants.find((x) => x.storeId === store.id && x.name === "ゆず")!;
    expect(e.divisions.map((d) => d.categoryOriginal)).toEqual(["デリヘル部門"]);
    expect(e.confidence).toBe("probable");
    expect(e.entrantRecord?.sourceIds).toEqual(["upd-src-0001"]);
  });
});

describe("出場者の記録（汎用の仕組み）", () => {
  const rawStore = (storeId: string, storeName: string): Phase3RawStore =>
    ({ storeId, storeName, storeNameOriginals: [storeName], prefecture: "愛媛県", listingAreas: ["松山"], categoryOriginals: ["テスト部門"] }) as Phase3RawStore;
  const rawRel: Phase3RawRelation = {
    relationId: "r1", storeId: "a", categoryOriginal: "テスト部門", confidence: "probable", sourceIds: ["s1"], phase1RecordIds: [],
  };
  const rawSrc = { sourceId: "s1", url: "https://example.com/", sourceType: "store", accessStatus: "x", publisherRole: "store_announcement", storeIds: ["a"], relationIds: [] } as Phase3RawSource;
  const layer = { stores: [rawStore("a", "店A"), rawStore("b", "店B")], relations: [rawRel], sources: [rawSrc] };
  const rec = (over: Partial<EntrantRawRecord> = {}): EntrantRawRecord => ({
    entrantId: "t-1", name: "はな", storeId: "a", sourceIds: ["s1"], evidence: "店舗の2026告知に「はな」エントリー",
    confidence: "unverified", checkedAt: "2026-10-06", ...over,
  });
  const errorsOf = (list: EntrantRawRecord[]) => validateEntrantRecords(list, layer).map((i) => i.message);

  it("人物名・店舗・根拠があれば、部門・個人URLなしで登録できる", () => {
    expect(errorsOf([rec()])).toEqual([]);
    expect(errorsOf([rec({ categoryOriginal: "テスト部門", personalUrl: "https://example.com/p" })])).toEqual([]);
  });

  it("必須項目が欠けている・根拠が2026年を示さない・店舗にない部門・重複は登録できない", () => {
    expect(errorsOf([rec({ name: " " })]).join()).toMatch(/人物名/);
    expect(errorsOf([rec({ storeId: "zzz" })]).join()).toMatch(/所属店舗/);
    expect(errorsOf([rec({ sourceIds: [] })]).join()).toMatch(/情報源/);
    expect(errorsOf([rec({ sourceIds: ["nope"] })]).join()).toMatch(/存在しない sourceId/);
    expect(errorsOf([rec({ evidence: "" })]).join()).toMatch(/evidence/);
    expect(errorsOf([rec({ evidence: "2025年の総選挙で入賞" })]).join()).toMatch(/2026/);
    expect(errorsOf([rec({ categoryOriginal: "別の部門" })]).join()).toMatch(/この店舗の部門にありません/);
    expect(errorsOf([rec({ personalUrl: "javascript:alert(1)" })]).join()).toMatch(/personalUrl/);
    expect(errorsOf([rec(), rec({ entrantId: "t-2" })]).join()).toMatch(/重複/);
  });

  it("記録は所属店舗の都道府県・掲載地域で表示され、部門は記録にあるときだけ結び付く", () => {
    const st = (id: string, name: string): SiteStore =>
      ({ id, origin: "update", name, nameOriginals: [name], prefecture: "愛媛県", listingAreas: ["松山"], categoryOriginals: ["テスト部門"],
        sourceType: "store", confidence: "probable", participationType: "x", isNewSincePhase1: true, phase1RecordIds: [], sourceIds: ["s1"] }) as SiteStore;
    const rel: SiteRelation = { id: "r1", storeId: "a", categoryOriginal: "テスト部門", confidence: "probable", sourceIds: ["s1"], phase1RecordIds: [] };
    const model = buildModel([], {
      layer: {
        stores: [st("a", "店A"), st("b", "店B")], relations: [rel], sources: [], countFacts: [],
        entrants: [adaptEntrantRecord(rec({ categoryOriginal: "テスト部門" })), adaptEntrantRecord(rec({ entrantId: "t-2", name: "みお", storeId: "b" }))],
      },
    });
    const hana = model.entrants.find((e) => e.name === "はな")!;
    expect([hana.prefectureName, hana.listingAreas, hana.storeId, hana.divisions.map((d) => d.categoryOriginal)]).toEqual(["愛媛県", ["松山"], "a", ["テスト部門"]]);
    const mio = model.entrants.find((e) => e.name === "みお")!;
    expect(mio.divisions).toEqual([]); // 部門を推測しない
    const items = buildSearchIndex(model);
    const top = searchItems(items, { q: "松山 みお" })[0].item;
    expect([top.kind, top.sub]).toEqual(["entrant", "店舗：店B"]);
  });
});
