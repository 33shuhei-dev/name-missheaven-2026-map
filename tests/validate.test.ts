import { describe, expect, it } from "vitest";
import type { Phase1Map, Phase1RawRecord } from "@/data/types";
import { validateDatasetSummary, validateMap, validateRecords } from "@/lib/validate";
import { phase1Dataset, phase1Map } from "@/lib/data";
import { rawRecords } from "./fixtures";

const base = rawRecords[0];
const errorsOf = (list: Phase1RawRecord[], update: Phase1RawRecord[] = []) =>
  validateRecords({ phase1: list, update })
    .filter((i) => i.level === "error")
    .map((i) => i.message);

describe("レコード検証", () => {
  it("正しいデータはエラーなし", () => {
    expect(errorsOf(rawRecords)).toEqual([]);
    expect(errorsOf([])).toEqual([]);
  });
  it("id 重複（データセットをまたいでも）", () => {
    expect(errorsOf([base, base]).some((m) => m.includes("重複"))).toBe(true);
    expect(errorsOf([base], [base]).some((m) => m.includes("重複"))).toBe(true);
  });
  it("不正な confidence / sourceType", () => {
    expect(errorsOf([{ ...base, confidence: "maybe" }]).length).toBe(1);
    expect(errorsOf([{ ...base, sourceType: "blog" }]).length).toBe(1);
    expect(errorsOf([{ ...base, regionConfidence: "sure" }]).length).toBe(1);
  });
  it("categoryOriginal 必須", () => {
    expect(errorsOf([{ ...base, categoryOriginal: "" }]).length).toBe(1);
  });
  it("不正な都道府県名", () => {
    expect(errorsOf([{ ...base, prefecture: "神奈川" }]).some((m) => m.includes("都道府県"))).toBe(true);
  });
  it("空文字は不可（不明は null）", () => {
    expect(errorsOf([{ ...base, storeName: "" }]).length).toBe(1);
    expect(errorsOf([{ ...base, entrantNames: ["", "a"] }]).length).toBe(1);
  });
  it("外部URLは http(s) のみ", () => {
    expect(errorsOf([{ ...base, entrantUrl: "javascript:alert(1)" }]).length).toBe(1);
    expect(errorsOf([{ ...base, regionSourceUrl: "ftp://example.com/x" }]).length).toBe(1);
  });
  it("sourceUrl のない confirmed は不可", () => {
    expect(errorsOf([{ ...base, sourceUrl: null }]).some((m) => m.includes("confirmed"))).toBe(true);
  });
  it("不正な日付", () => {
    expect(errorsOf([{ ...base, checkedAt: "2026/10/05" }]).length).toBe(1);
    expect(errorsOf([{ ...base, checkedAt: "2026-02-30" }]).length).toBe(1);
    expect(errorsOf([{ ...base, checkedAt: "2026-10-05T03:42:42.879040+00:00" }])).toEqual([]);
  });
  it("area と listingArea の不一致", () => {
    expect(errorsOf([{ ...base, area: "別の場所" }]).length).toBe(1);
  });
  it("県なしの掲載地域は警告（推定しない）", () => {
    const issues = validateRecords({ phase1: [rawRecords[4]], update: [] });
    expect(issues.map((i) => i.level)).toEqual(["warning"]);
  });
});

describe("地図データの検証", () => {
  const records = phase1Dataset.records;
  const clone = (): Phase1Map => JSON.parse(JSON.stringify(phase1Map));

  it("Phase 1 の地図データはレコードと整合する", () => {
    expect(validateMap(phase1Map, records)).toEqual([]);
  });
  it("県の欠落を検出する", () => {
    const m = clone();
    m.prefectures.pop();
    expect(validateMap(m, records).some((i) => i.message.includes("47"))).toBe(true);
  });
  it("県の重複を検出する", () => {
    const m = clone();
    m.prefectures[1] = { ...m.prefectures[0] };
    expect(validateMap(m, records).some((i) => i.message.includes("重複"))).toBe(true);
  });
  it("status の食い違いを検出する", () => {
    const m = clone();
    const p = m.prefectures.find((x) => x.status === "searched_no_evidence")!;
    p.status = "confirmed";
    expect(validateMap(m, records).some((i) => i.message.includes("status"))).toBe(true);
  });
  it("件数の食い違いを検出する", () => {
    const m = clone();
    m.prefectures[0].recordCount += 1;
    expect(validateMap(m, records).some((i) => i.message.includes("recordCount"))).toBe(true);
  });
  it("県コードの誤りを検出する", () => {
    const m = clone();
    m.prefectures[0].prefectureCode = "99";
    expect(validateMap(m, records).some((i) => i.message.includes("JIS"))).toBe(true);
  });
});

describe("summary の検証", () => {
  it("Phase 1 の summary はレコードと整合する", () => {
    expect(validateDatasetSummary(phase1Dataset)).toEqual([]);
  });
  it("食い違いを検出する", () => {
    const d = { ...phase1Dataset, summary: { ...phase1Dataset.summary, recordCount: 999 } };
    expect(validateDatasetSummary(d).map((i) => i.id)).toEqual(["recordCount"]);
  });
});
