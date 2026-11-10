import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SNS共有（OGP）", () => {
  it("トップと特集に、X用の大きい画像カードの設定がある", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    const feature = readFileSync("app/feature/page.tsx", "utf8");
    for (const src of [layout, feature]) {
      expect(src).toContain('card: "summary_large_image"');
      expect(src).toContain("/og-feature.jpg");
    }
    expect(layout).toContain("metadataBase");
  });
  it("共有用画像が用意されている", () => {
    expect(existsSync("public/og-feature.jpg")).toBe(true);
  });
  it("共有の設定を足しても、検索エンジンに出さない設定は残っている", () => {
    expect(readFileSync("app/layout.tsx", "utf8")).toContain("robots: { index: false, follow: false }");
  });
});
