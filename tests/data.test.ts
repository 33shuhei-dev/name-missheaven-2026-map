import { describe, expect, it } from "vitest";
import { candidates } from "@/data/candidates";
import { verified } from "@/data/verified";
import { buildModel, toRecords } from "@/lib/model";
import { validateDatasets } from "@/lib/validate";
import { site } from "@/lib/data";

/**
 * 本番データ（data/）の検証。データを追加したら `npm run validate:data` で確認できる。
 */
describe("本番データ", () => {
  const sets = { verified, candidate: candidates };

  it("検証エラーがない", () => {
    const errors = validateDatasets(sets).filter((i) => i.level === "error");
    expect(errors).toEqual([]);
  });

  it("調査候補に confirmed が混入していない", () => {
    expect(candidates.filter((e) => e.confidence === "confirmed")).toEqual([]);
  });

  it("sourceUrl のない情報は confirmed になっていない", () => {
    const all = [...verified, ...candidates];
    expect(all.filter((e) => !e.sourceUrl && e.confidence === "confirmed")).toEqual([]);
  });

  it("確認済みデータはすべて確認元URLと確認日を持つ", () => {
    for (const e of verified) {
      expect(e.sourceUrl, e.id).toMatch(/^https?:\/\//);
      expect(e.checkedAt, e.id).toBeTruthy();
    }
  });

  it("調査候補にURLが捏造されていない（v0.1時点の候補はURLなし）", () => {
    const withUrl = candidates.filter((e) => e.sourceUrl || e.entrantUrl || e.storeUrl);
    expect(withUrl).toEqual([]);
  });

  it("テスト用の架空データが混入していない", () => {
    const text = JSON.stringify([...verified, ...candidates]);
    expect(text).not.toMatch(/example\.(com|org|net)|テスト|サンプル|ダミー|dummy/i);
  });

  it("似た部門名を統合せず原文のまま保持している", () => {
    const names = new Set(candidates.map((e) => e.categoryOriginal));
    for (const n of ["美尻美脚", "美尻・美脚", "店長一押し", "店長イチオシ", "かわいいアイドル", "アイドル・可愛い"]) {
      expect(names.has(n), n).toBe(true);
    }
  });

  it("部門IDに衝突がない", () => {
    const model = buildModel(toRecords(sets));
    const keys = new Set(
      model.divisions.map((d) => `${d.prefSlug}|${d.area ?? ""}|${d.categoryOriginal}`),
    );
    expect(keys.size).toBe(model.divisions.length);
    expect(new Set(model.divisions.map((d) => d.id)).size).toBe(model.divisions.length);
  });

  it("サイトモデルを構築できる", () => {
    expect(site.stats.recordCount).toBe(verified.length + candidates.length);
    expect(site.stats.byDataset.candidate).toBe(candidates.length);
  });
});
