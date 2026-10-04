import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConfidenceBadge } from "@/components/Badges";
import { CONFIDENCE_DESCRIPTION, CONFIDENCE_ORDER, DATASET_LABEL } from "@/lib/labels";

export const metadata: Metadata = { title: "このサイトについて" };

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "このサイトについて" }]} />
      <h1>このサイトについて</h1>

      <section className="section">
        <h2>非公式サイトです</h2>
        <p>
          本サイトは、ミスヘブン総選挙2026について全国に分散している情報（都道府県・エリア・部門・出場者・店舗・確認元）を、有志が整理している
          <strong>非公式</strong>のサイトです。主催者・公式サイト・掲載店舗・出場者とは一切関係がなく、公式の発表ではありません。
        </p>
        <p>人物写真や公式の宣材画像は掲載していません。詳しい情報は各確認元のリンク先でご確認ください。</p>
      </section>

      <section className="section">
        <h2>確認状態について</h2>
        <ul className="plain-list">
          {CONFIDENCE_ORDER.map((c) => (
            <li key={c}>
              <ConfidenceBadge value={c} /> {CONFIDENCE_DESCRIPTION[c]}
            </li>
          ))}
        </ul>
        <p>
          また、データの区分として「{DATASET_LABEL.verified}」（確認元URLを確認して登録した情報）と「
          {DATASET_LABEL.candidate}」（過去の調査で見つかった候補で、一次情報での再確認が済んでいない情報）を分けて表示しています。
        </p>
      </section>

      <section className="section">
        <h2>部門名の表記について</h2>
        <p>
          部門名は確認元に掲載された表記をそのまま掲載しています。「美尻美脚」と「美尻・美脚」のように似た名前でも、同じ部門と確認できない限り統合していません。
          検索では記号・空白・カタカナとひらがなの違いを無視して探せるようにしています。
        </p>
        <p>「部門」は「都道府県・エリア・部門名」の組み合わせごとに数えています。</p>
      </section>

      <section className="section">
        <h2>情報の誤り・削除のご連絡</h2>
        <p>
          v0.1 では受付窓口を用意していません。掲載内容に誤りがある場合も、各確認元の最新情報を優先してください。
        </p>
      </section>
    </>
  );
}
