import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MugenVote } from "@/components/MugenVote";

export const metadata: Metadata = {
  title: "無限投票（遊び）",
  description: "投票しているように見えるだけの、意味のないタップゲーム。本物の投票ではありません。",
  openGraph: {
    title: "無限投票（遊び）",
    description: "投票しているように見えるだけの、意味のないタップゲーム。本物の投票ではありません。",
    images: [{ url: "https://name-missheaven-2026-map.vercel.app/game/og.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["https://name-missheaven-2026-map.vercel.app/game/og.jpg"] },
};

export default function GamePage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "ゲーム：無限投票" }]} />
      <p className="game-tag"><span>ゲーム</span></p>
      <h1>無限投票</h1>
      <p className="hint">投票しているように見えるだけの、意味のないタップゲームです。非公式の遊びで、本物の投票とは関係ありません。</p>
      <MugenVote />
    </>
  );
}
