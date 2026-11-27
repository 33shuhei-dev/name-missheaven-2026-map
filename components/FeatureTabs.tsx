import Link from "next/link";

/** 特集の切り替え（特集1〜4）。どの特集ページにも置いて、以前の特集が埋もれないようにする */
export const FEATURES = [
  { no: 1, href: "/feature", title: "票は分散する。7,634人の本選を、どう戦うか", lead: "200人の人数戦と、神15の票数戦" },
  { no: 2, href: "/feature/history", title: "総選挙の歩みと、2026年の戦略", lead: "歴代の結果とルールの変化から、本選の戦い方を考える" },
  { no: 3, href: "/feature/yosen", title: "予選を突破したのは何人？", lead: "都道府県別の本選進出率を読み解く" },
  { no: 4, href: "/feature/bumon", title: "本選は、49の小さな選挙だった", lead: "部門ごとの人数から読む。順位アイコンと、神15への狭き門" },
  { no: 5, href: "/feature/shuppan", title: "楽しかったなら、勝ち。", lead: "出場者のみなさんへ：うれしかったことも、しんどかったことも、ぜんぶ" },
  { no: 6, href: "/feature/ouen", title: "応援も、がんばりだった。", lead: "応援する側のみなさんへ：しんどさも、うれしさも、ぜんぶ" },
] as const;

export function FeatureTabs({ current }: { current: 1 | 2 | 3 | 4 | 5 | 6 }) {
  return (
    <nav className="feature-tabs" aria-label="特集の一覧">
      {FEATURES.map((f) => (
        <Link key={f.no} href={f.href} className={f.no === current ? "feature-tab feature-tab--active" : "feature-tab"} aria-current={f.no === current ? "page" : undefined}>
          <span className="feature-tab__no">特集{f.no}</span>
          <span className="feature-tab__title">{f.title}</span>
        </Link>
      ))}
    </nav>
  );
}
