import { describe, expect, it } from "vitest";
import { normalizeForSearch, tokenizeQuery } from "@/lib/text";

describe("normalizeForSearch", () => {
  it("区切り記号を無視する（美尻・美脚 = 美尻美脚）", () => {
    expect(normalizeForSearch("美尻・美脚")).toBe(normalizeForSearch("美尻美脚"));
  });
  it("カタカナとひらがなを同一視する", () => {
    expect(normalizeForSearch("イチオシ")).toBe("いちおし");
  });
  it("全角英数・大文字小文字を同一視する", () => {
    expect(normalizeForSearch("ＷＥＢ予約")).toBe(normalizeForSearch("web予約"));
    expect(normalizeForSearch("TiAmo")).toBe("tiamo");
  });
  it("半角カナを扱える", () => {
    expect(normalizeForSearch("ｺｽﾌﾟﾚ")).toBe(normalizeForSearch("コスプレ"));
  });
  it("装飾記号・括弧・波線を無視する", () => {
    expect(normalizeForSearch("大好き♡おっぱい")).toBe(normalizeForSearch("大好きおっぱい"));
    expect(normalizeForSearch("うちは地元が好きじゃけぇ♪")).toBe(normalizeForSearch("うちは地元が好きじゃけぇ"));
    expect(normalizeForSearch("ギャル（白・黒）")).toBe(normalizeForSearch("ギャル白黒"));
    expect(normalizeForSearch("なみへ～")).toBe(normalizeForSearch("なみへ"));
  });
  it("長音記号は残す", () => {
    expect(normalizeForSearch("ソープ")).toBe("そーぷ");
  });
  it("空値は空文字", () => {
    expect(normalizeForSearch(undefined)).toBe("");
    expect(normalizeForSearch("")).toBe("");
  });
});

describe("tokenizeQuery", () => {
  it("半角・全角空白で分割する", () => {
    expect(tokenizeQuery("川崎　コスプレ  ")).toEqual(["川崎", "こすぷれ"]);
  });
  it("記号だけの語は捨てる", () => {
    expect(tokenizeQuery("・ ♡")).toEqual([]);
  });
});
