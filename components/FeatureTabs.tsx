import Link from "next/link";

/** 特集の切り替え（特集1・特集2）。どの特集ページにも置いて、以前の特集が埋もれないようにする */
export const FEATURES = [
  { no: 1, href: "/feature", title: "まず200人、そして15万票へ", lead: "2026年の神15を、数字で考える" },
  { no: 2, href: "/feature/history", title: "総選挙の歩みと、2026年の戦略", lead: "歴代の結果とルールの変化から、本選の戦い方を考える" },
  { no: 3, href: "/feature/yosen", title: "予選を突破したのは何人？", lead: "都道府県別の本選進出率を読み解く" },
] as const;

export function FeatureTabs({ current }: { current: 1 | 2 | 3 }) {
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
