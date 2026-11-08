import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("特集ページ（200人と15万票）", () => {
  const src = readFileSync("app/feature/page.tsx", "utf8");
  it("200人は称号の条件で神15の条件ではないこと、仮定の計算であることを書いている", () => {
    expect(src).toContain("称号の条件で、神15の条件ではありません");
    expect(src).toContain("同じ倍率だったと仮定した計算");
    expect(src).toContain("神15のボーダーではありません");
  });
  it("本選の終了日は11月23日", () => {
    expect(src).toContain("終了は11月23日");
    expect(src).not.toContain("11月24日");
  });
  it("未確認の点を明記している", () => {
    expect(src).toContain("本文を直接確認できていません");
  });
  it("トップとフッターからリンクしている", () => {
    expect(readFileSync("app/page.tsx", "utf8")).toContain('href="/feature"');
    expect(readFileSync("components/SiteFooter.tsx", "utf8")).toContain('href="/feature"');
  });
});

describe("特集への入口", () => {
  it("トップにバナー、ヘッダーに目立つ「特集」リンクがある", () => {
    expect(readFileSync("app/page.tsx", "utf8")).toContain("feature-banner");
    expect(readFileSync("components/SiteHeader.tsx", "utf8")).toContain("site-nav__feature");
  });
});

describe("応援曲の動画", () => {
  it("トップのステージの中に動画があり、自動再生しない（非公式・有志制作の表記つき）", () => {
    expect(readFileSync("app/page.tsx", "utf8")).toContain("<VoteAudioPlayer />");
    const src = readFileSync("components/VoteAudioPlayer.tsx", "utf8");
    expect(src).toContain("/vote-vote-vote-lyric-mv.mp4");
    expect(src).toContain("非公式・有志制作");
    expect(src).not.toContain("autoPlay");
    expect(src).toContain('preload="none"');
  });
});

describe("特集：総選挙の歴史", () => {
  it("確認できたことだけを載せ、わからなかったことを明記している", () => {
    const src = readFileSync("app/feature/history/page.tsx", "utf8");
    expect(src).toContain("わからなかったこと");
    expect(src).toContain("確認できていない");
    expect(src).toContain("媒体の記事のみ");
    expect(src).toContain("運営者の確認による11/23(月) 23:59");
    expect(src).toContain("近年の大会では、投票参加者数や得票数の記録更新が報じられています");
    expect(src).not.toContain("規模は年々大きくなっています");
    expect(src).toContain("歩み：歴代グランプリと、応援のかたちの変化");
    expect(src).toContain("2026年の戦略：歴史から何が言えるか");
    expect(src).toContain("結果を予測するものではなく、保証もしません");
    expect(src).toContain("2026年の神15の枠の配分は、確認できていません");
  });
});

describe("特集の入口", () => {
  it("200人の特集から、歩みと戦略の特集へリンクしている", () => {
    expect(readFileSync("app/feature/page.tsx", "utf8")).toContain("/feature/history");
  });
});
