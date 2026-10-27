import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** 「このサイトについて」の、掲載情報の修正・削除の問い合わせ案内 */
describe("このサイトについて：修正・削除の問い合わせ窓口", () => {
  const src = readFileSync("app/about/page.tsx", "utf8") + readFileSync("lib/contact.ts", "utf8");

  it("修正・削除の案内と、応援用Xアカウント（DM）への連絡先がある", () => {
    expect(src).toContain("掲載情報について");
    expect(src).toContain("掲載内容に誤りがある場合や、掲載情報の修正・削除をご希望の場合は、運営者までご連絡ください。確認のうえ対応します。");
    expect(src).toContain('CONTACT_X_URL = "https://x.com/rego0701"');
    expect(src).toContain('CONTACT_X_HANDLE = "@rego0701"');
    expect(src).toContain("DM");
  });

  it("既存の非公式サイトとしての説明を維持している", () => {
    for (const t of ["公式サイトではありません", "公開されている情報をもとに整理", "全出場者・全部門の網羅は保証しません", "最新・正確な情報は、各ページにリンクしている情報源や公式の案内でご確認ください"]) {
      expect(src).toContain(t);
    }
  });

  it("掲載依頼の案内（送ってほしい内容）があり、トップ・検索0件・店舗ページから案内している", () => {
    expect(src).toContain('id="listing"');
    expect(src).toContain("掲載依頼");
    for (const f of ["app/page.tsx", "components/SearchClient.tsx", "app/store/[id]/page.tsx"]) expect(readFileSync(f, "utf8")).toContain("<ListingRequestCta");
  });
});
