import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MugenVote } from "@/components/MugenVote";

export const metadata: Metadata = {
  title: "無限投票（遊び）",
  description: "投票しているように見えるだけの、意味のないタップゲーム。本物の投票ではありません。",
};

export default function GamePage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "無限投票（遊び）" }]} />
      <h1>無限投票</h1>
      <p className="hint">投票しているように見えるだけの、意味のないタップゲームです。非公式の遊びで、本物の投票とは関係ありません。</p>
      <MugenVote />
    </>
  );
}
