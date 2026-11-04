import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { prefectureFromHeavenUrl } from "@/lib/cityheaven-url";

describe("掲載依頼：在籍ページのURLから都道府県を読み取る", () => {
  it("URLの文字列から都道府県名を返す（在籍ページ・店舗ページ・?lo=1付き）", () => {
    expect(prefectureFromHeavenUrl("https://www.cityheaven.net/tokyo/A1324/A132401/87tsubaki/girlid-63884920/?lo=1")).toBe("東京都");
    expect(prefectureFromHeavenUrl("https://www.cityheaven.net/kumamoto/A4301/A430102/theobroma/")).toBe("熊本県");
    expect(prefectureFromHeavenUrl("「はな」エコ梅田店 https://www.cityheaven.net/osaka/A2701/A270101/eco/girlid-1/")).toBe("大阪府");
  });
  it("ヘブン以外・読めないURLは null", () => {
    expect(prefectureFromHeavenUrl("https://example.com/tokyo/A1/A2/x")).toBeNull();
    expect(prefectureFromHeavenUrl("https://share.google/xxxx")).toBeNull();
    expect(prefectureFromHeavenUrl("")).toBeNull();
  });
});

describe("掲載依頼：画面の作り", () => {
  it("フォームは送信・保存をしない（fetch・localStorage なし）。店舗ページの案内はお店向けの文言", () => {
    const form = readFileSync("components/ListingRequestForm.tsx", "utf8");
    expect(form).not.toMatch(/fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon/);
    expect(readFileSync("components/ListingRequestCta.tsx", "utf8")).toContain("お店の方へ");
    expect(readFileSync("app/store/[id]/page.tsx", "utf8")).toContain("<ListingRequestCta compact forStore />");
  });
});

describe("掲載依頼・検索の導線の改善（UXレビューの反映）", () => {
  it("フォームは、URLの入力欄を持たず、コピー後に「まだ送信されていません」を案内する", () => {
    const form = readFileSync("components/ListingRequestForm.tsx", "utf8");
    expect(form).not.toContain("prefectureFromHeavenUrl");
    expect(form).toContain("まだ送信されていません");
    expect(form).toContain("リンクは貼りません");
  });
  it("案内のリンク名は「掲載依頼の文面を作る」。検索は都道府県の件数を出さず、0件時に絞り込み解除を出す", () => {
    expect(readFileSync("components/ListingRequestCta.tsx", "utf8")).toContain("掲載依頼の文面を作る");
    const s = readFileSync("components/SearchClient.tsx", "utf8");
    expect(s).not.toContain("{p.name}（{p.recordCount}）");
    expect(s).toContain("絞り込みを外して");
    expect(s).toContain("showCounts");
  });
});
