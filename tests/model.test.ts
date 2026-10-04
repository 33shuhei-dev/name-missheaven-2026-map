import { describe, expect, it } from "vitest";
import {
  buildModel,
  findDivision,
  findPrefectureView,
  regionsWithPrefectures,
  sameNameDivisions,
  toRecords,
  variantDivisions,
} from "@/lib/model";
import { fixtureSets } from "./fixtures";

const model = buildModel(toRecords(fixtureSets));

describe("toRecords", () => {
  it("データセット区分を付与する", () => {
    const records = toRecords(fixtureSets);
    expect(records.find((r) => r.id === "t-v-1")?.dataset).toBe("verified");
    expect(records.find((r) => r.id === "t-c-1")?.dataset).toBe("candidate");
  });
});

describe("部門の組み立て", () => {
  it("都道府県×エリア×部門名で部門をまとめる", () => {
    const d = model.divisions.find((x) => x.categoryOriginal === "美尻美脚")!;
    expect(d.prefSlug).toBe("kanagawa");
    expect(d.area).toBe("テスト市");
    expect(d.records.map((r) => r.id)).toEqual(["t-v-1", "t-v-2"]);
    expect(d.entrantCount).toBe(2);
    expect(d.storeNames).toEqual(["テスト店舗X"]);
    expect(d.confidence).toBe("confirmed");
  });

  it("似た名称でも別の部門として保持する", () => {
    const names = model.divisions.map((d) => d.categoryOriginal);
    for (const n of ["美尻美脚", "美尻・美脚", "店長一押し", "店長イチオシ", "かわいいアイドル", "アイドル・可愛い"]) {
      expect(names).toContain(n);
    }
  });

  it("部門IDは決定的かつ一意", () => {
    const again = buildModel(toRecords(fixtureSets));
    expect(again.divisions.map((d) => d.id)).toEqual(model.divisions.map((d) => d.id));
    expect(new Set(model.divisions.map((d) => d.id)).size).toBe(model.divisions.length);
    const d = model.divisions[0];
    expect(findDivision(model, d.id)).toBe(d);
    expect(findDivision(model, "nope")).toBeNull();
  });

  it("表記揺れの可能性がある部門を区別して返す", () => {
    const d = model.divisions.find((x) => x.categoryOriginal === "美尻美脚")!;
    expect(sameNameDivisions(model, d)).toEqual([]);
    expect(variantDivisions(model, d).map((x) => x.categoryOriginal)).toEqual(["美尻・美脚"]);
    const ichioshi = model.divisions.find((x) => x.categoryOriginal === "店長イチオシ")!;
    expect(variantDivisions(model, ichioshi).map((x) => x.categoryOriginal)).toEqual(["店長一押し"]);
  });

  it("部門名一覧で表記揺れをまとめるが原文は別々に保持する", () => {
    const g = model.categories.find((c) => c.names.some((n) => n.name === "美尻美脚"))!;
    expect(g.names.map((n) => n.name).sort()).toEqual(["美尻・美脚", "美尻美脚"].sort());
    const idol = model.categories.filter((c) => c.names.some((n) => n.name.includes("アイドル")));
    expect(idol).toHaveLength(2);
  });
});

describe("部分データ", () => {
  it("都道府県だけ判明している情報は都道府県に計上され、部門は作らない", () => {
    const hokkaido = findPrefectureView(model, "hokkaido")!;
    expect(hokkaido.recordCount).toBe(1);
    expect(hokkaido.divisionCount).toBe(0);
    expect(hokkaido.areas).toHaveLength(1);
    expect(hokkaido.areas[0].name).toBeUndefined();
    expect(hokkaido.areas[0].label).toBe("エリア未判明");
    expect(hokkaido.areas[0].uncategorized.map((r) => r.id)).toEqual(["t-c-5"]);
  });

  it("店舗だけ判明している情報は部門未判明として扱う", () => {
    const shizuoka = findPrefectureView(model, "shizuoka")!;
    expect(shizuoka.areas[0].uncategorized.map((r) => r.id)).toEqual(["t-c-6"]);
  });

  it("部門だけ判明している情報は都道府県未判明にまとめる", () => {
    const unknown = model.unknownPrefecture!;
    expect(unknown.slug).toBe("unknown");
    expect(unknown.divisionCount).toBe(2);
    expect(unknown.areas[0].divisions.every((d) => d.prefectureName === "都道府県未判明")).toBe(true);
  });

  it("エリア未判明はエリア一覧の最後に並ぶ", () => {
    const osaka = findPrefectureView(model, "osaka")!;
    expect(osaka.areas.map((a) => a.label)).toEqual(["テスト北", "エリア未判明"]);
  });

  it("出場者不明の部門は出場者0名", () => {
    const d = model.divisions.find((x) => x.categoryOriginal === "美尻・美脚")!;
    expect(d.entrantCount).toBe(0);
    expect(d.storeNames).toEqual([]);
  });
});

describe("掲載状況（自動算出）", () => {
  it("件数をデータから数える", () => {
    const s = model.stats;
    expect(s.recordCount).toBe(10);
    expect(s.byDataset).toEqual({ verified: 3, candidate: 7 });
    expect(s.byConfidence).toEqual({ confirmed: 2, probable: 2, unverified: 6 });
    expect(s.divisionCount).toBe(model.divisions.length);
    expect(s.categoryNameCount).toBe(7);
    expect(s.prefectureWithDataCount).toBe(5);
    expect(s.prefectureTotal).toBe(47);
    expect(s.entrantCount).toBe(4);
    expect(s.storeCount).toBe(3);
    expect(s.lastCheckedAt).toBe("2026-09-15");
  });

  it("データ0件の都道府県も表示対象に含む", () => {
    expect(model.prefectures).toHaveLength(47);
    expect(findPrefectureView(model, "okinawa")!.recordCount).toBe(0);
    expect(findPrefectureView(model, "no-such-pref")).toBeNull();
  });

  it("地方ごとの件数", () => {
    const regions = regionsWithPrefectures(model);
    expect(regions).toHaveLength(8);
    expect(regions.find((r) => r.region.id === "kanto")!.recordCount).toBe(3);
    expect(regions.find((r) => r.region.id === "shikoku")!.recordCount).toBe(0);
  });
});

describe("空データ", () => {
  it("0件でも破綻しない", () => {
    const empty = buildModel([]);
    expect(empty.divisions).toEqual([]);
    expect(empty.categories).toEqual([]);
    expect(empty.unknownPrefecture).toBeNull();
    expect(empty.prefectures).toHaveLength(47);
    expect(empty.prefectures.every((p) => p.recordCount === 0 && p.areas.length === 0)).toBe(true);
    expect(empty.stats.recordCount).toBe(0);
    expect(empty.stats.lastCheckedAt).toBeNull();
    expect(empty.stats.prefectureWithDataCount).toBe(0);
  });
});
