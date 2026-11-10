import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { YUZU_SUPPORT_URL } from "@/components/YuzuSupportLink";

describe("運営者の応援ツールへのリンク", () => {
  it("計測用パラメータを付けない、https のURLである", () => {
    expect(YUZU_SUPPORT_URL).toBe("https://yuzu-gakari.vercel.app/");
    expect(YUZU_SUPPORT_URL).not.toContain("utm_");
  });
  it("掲載情報とは別であることを明記し、別タブ・参照元なしで開く", () => {
    const src = readFileSync("components/YuzuSupportLink.tsx", "utf8");
    expect(src).toContain("掲載情報とは別");
    expect(src).toContain("掲載内容の確かさや順位とは関係ありません");
    expect(src).toContain('rel="noopener noreferrer nofollow ugc"');
    expect(src).toContain('target="_blank"');
  });
  it("フッターと特集ページに置いている", () => {
    expect(readFileSync("components/SiteFooter.tsx", "utf8")).toContain("<YuzuSupportFooterLine />");
    expect(readFileSync("app/feature/page.tsx", "utf8")).toContain("<YuzuSupportNote />");
  });
});
