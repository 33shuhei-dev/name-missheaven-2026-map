import { describe, expect, it } from "vitest";
import type { Entry } from "@/data/types";
import { validateDatasets } from "@/lib/validate";
import { fixtureSets } from "./fixtures";

const base: Entry = {
  id: "x-1",
  prefecture: "東京都",
  categoryOriginal: "テスト部門",
  sourceType: "other",
  confidence: "unverified",
};

function errorsOf(verified: Entry[], candidate: Entry[] = []) {
  return validateDatasets({ verified, candidate })
    .filter((i) => i.level === "error")
    .map((i) => i.message);
}

describe("データバリデーション", () => {
  it("正しいフィクスチャはエラーなし", () => {
    expect(validateDatasets(fixtureSets).filter((i) => i.level === "error")).toEqual([]);
  });

  it("空データはエラーなし", () => {
    expect(validateDatasets({ verified: [], candidate: [] })).toEqual([]);
  });

  it("id重複（データセットをまたいでも）を検出", () => {
    expect(errorsOf([], [base, base]).some((m) => m.includes("重複"))).toBe(true);
    const v = { ...base, sourceUrl: "https://example.com", confidence: "confirmed" as const, checkedAt: "2026-01-01" };
    expect(errorsOf([v], [base]).some((m) => m.includes("重複"))).toBe(true);
  });

  it("不正なid", () => {
    expect(errorsOf([], [{ ...base, id: "あ い" }]).length).toBeGreaterThan(0);
  });

  it("候補データに confirmed は不可", () => {
    const e = { ...base, confidence: "confirmed" as const, sourceUrl: "https://example.com" };
    expect(errorsOf([], [e]).some((m) => m.includes("調査候補"))).toBe(true);
  });

  it("sourceUrl のない confirmed は不可", () => {
    const e = { ...base, confidence: "confirmed" as const, checkedAt: "2026-01-01" };
    expect(errorsOf([e]).some((m) => m.includes("sourceUrl"))).toBe(true);
  });

  it("verified には sourceUrl・checkedAt が必須で unverified 不可", () => {
    const msgs = errorsOf([{ ...base }]);
    expect(msgs.some((m) => m.includes("verified には sourceUrl"))).toBe(true);
    expect(msgs.some((m) => m.includes("checkedAt"))).toBe(true);
    expect(msgs.some((m) => m.includes("unverified"))).toBe(true);
  });

  it("不正な都道府県名", () => {
    expect(errorsOf([], [{ ...base, prefecture: "神奈川" }]).some((m) => m.includes("都道府県"))).toBe(true);
  });

  it("http(s)以外のURLは不可", () => {
    expect(errorsOf([], [{ ...base, entrantUrl: "javascript:alert(1)" }]).length).toBe(1);
    expect(errorsOf([], [{ ...base, storeUrl: "ftp://example.com" }]).length).toBe(1);
  });

  it("不正な日付", () => {
    expect(errorsOf([], [{ ...base, checkedAt: "2026/01/01" }]).length).toBe(1);
    expect(errorsOf([], [{ ...base, checkedAt: "2026-02-30" }]).length).toBe(1);
  });

  it("空文字・前後空白は不可", () => {
    expect(errorsOf([], [{ ...base, area: "" }]).length).toBe(1);
    expect(errorsOf([], [{ ...base, entrantName: " 名前" }]).length).toBe(1);
  });

  it("何も判明していない情報は不可", () => {
    const e: Entry = { id: "x-2", sourceType: "other", confidence: "unverified" };
    expect(errorsOf([], [e]).some((m) => m.includes("いずれも未入力"))).toBe(true);
  });

  it("categoryOriginal なしの categoryNormalized は不可", () => {
    expect(errorsOf([], [{ ...base, categoryOriginal: undefined, categoryNormalized: "x" }]).length).toBe(1);
  });

  it("不正な confidence / sourceType", () => {
    const e = { ...base, confidence: "maybe", sourceType: "blog" } as unknown as Entry;
    expect(errorsOf([], [e])).toHaveLength(2);
  });

  it("都道府県なしのエリアは警告", () => {
    const issues = validateDatasets({ verified: [], candidate: [{ ...base, prefecture: undefined, area: "どこか" }] });
    expect(issues.map((i) => i.level)).toEqual(["warning"]);
  });
});
