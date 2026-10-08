import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

/** Yahoo!通常のWeb検索（search.yahoo.co.jp/search?）は robots.txt で Disallow。調査スクリプトから再利用されないようにする */
describe("Yahoo!通常検索の禁止経路ガード", () => {
  const dir = join(process.cwd(), "scripts/research");
  const files = readdirSync(dir).filter((f) => f.endsWith(".py"));
  const read = (f: string) => readFileSync(join(dir, f), "utf-8");

  it("ysearch.py は先頭で停止する", () => {
    expect(read("ysearch.py").split("\n")[0]).toContain("raise SystemExit");
  });

  it("禁止経路のURLを組み立てるのは、ysearch.py（停止済み）と、記録用のURL文字列だけの build_phase3b.py のみ", () => {
    const hits = files.filter((f) => read(f).includes("search.yahoo.co.jp/search?"));
    expect(hits.sort()).toEqual(["build_phase3b.py", "ysearch.py"]);
  });

  it("ysearch を読み込むスクリプトは、読み込み時点で停止する（ysearch.py が先頭で停止するため）", () => {
    const users = files.filter((f) => /from ysearch import|import ysearch/.test(read(f)));
    expect(users.length).toBeGreaterThan(0);
    expect(read("ysearch.py")).toMatch(/^raise SystemExit/);
  });
});
