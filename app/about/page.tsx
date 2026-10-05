import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConfidenceBadge, StatusBadge } from "@/components/Badges";
import { datasetInfo, site } from "@/lib/data";
import { dateOnly } from "@/lib/phase1";
import {
  CONFIDENCE_DESCRIPTION,
  CONFIDENCE_ORDER,
  MAP_STATUS_DESCRIPTION,
  MAP_STATUS_ORDER,
} from "@/lib/labels";

export const metadata: Metadata = { title: "このサイトについて" };

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "このサイトについて" }]} />
      <h1>このサイトについて</h1>

      <section className="section card prose">
        <h2>非公式の情報まとめです</h2>
        <ul>
          <li>
            本サイトは<strong>公式サイトではありません</strong>。ミスヘブン総選挙の主催者・公式サイト・掲載店舗・出場者とは関係のない、有志による非公式のまとめです。
          </li>
          <li>店舗の告知・本人の日記やSNSなど、<strong>公開されている情報をもとに整理</strong>しています。</li>
          <li>
            <strong>全出場者・全部門の網羅は保証しません</strong>。掲載しているのは、調査で確認できた範囲だけです。掲載がないことは「存在しない」という意味ではありません。
          </li>
          <li>
            情報は<strong>更新される可能性があります</strong>。最新・正確な情報は、各ページにリンクしている情報源や公式の案内でご確認ください。
          </li>
          <li>人物写真や公式の宣材画像は掲載していません。情報源の全文・画像は複製せず、リンクと必要最小限の事実のみを表示しています。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>地図の色（調査状態）</h2>
        <p>地図の色は人気・順位・出場者数ではなく、その都道府県について情報をどこまで確認できたかを表します。</p>
        <ul className="plain-list">
          {MAP_STATUS_ORDER.map((s) => (
            <li key={s}>
              <StatusBadge value={s} />
              <span className="plain-list__desc">{MAP_STATUS_DESCRIPTION[s]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section card prose">
        <h2>確認状態</h2>
        <p>各観測（「この地域のこの部門に、この店舗・出場者が出ている」という1件の情報）ごとに、確認状態を表示しています。</p>
        <ul className="plain-list">
          {CONFIDENCE_ORDER.map((c) => (
            <li key={c}>
              <ConfidenceBadge value={c} />
              <span className="plain-list__desc">{CONFIDENCE_DESCRIPTION[c]}</span>
            </li>
          ))}
        </ul>
        <p>部門名と地域のそれぞれの確認状態が、総合の確認状態と異なる場合があります（観測カードに「部門名：」「地域：」として表示）。</p>
      </section>

      <section className="section card prose">
        <h2>掲載地域と正式な選挙エリア</h2>
        <p>
          「掲載地域」は、情報源に書かれた店舗の掲載・営業地域です。<strong>正式な選挙エリアではありません</strong>。正式な選挙エリアは現在確認できておらず、店舗の所在地や地名から推測して表示することもしていません。
        </p>
        <p>
          都道府県を確認できていない情報は「地域未判明」としてまとめ、地図には配置していません。部門名に地名が含まれていても、その地名から都道府県を割り当てていません。
        </p>
      </section>

      <section className="section card prose">
        <h2>部門名・件数について</h2>
        <ul>
          <li>部門名は情報源の掲載原文のまま表示しています。記号・絵文字・語順などが違う似た名前も統合していません。</li>
          <li>「部門」の数は、部門名（原文）の種類数です。</li>
          <li>
            「出場者」の数は店舗名×人物名の組み合わせの数です。実際の人数の重複排除ではなく、同姓同名の別人を統合することもしていません。
          </li>
          <li>すべての件数はデータから自動で集計しています。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>データ</h2>
        <dl className="facts facts--plain">
          <div>
            <dt>基準データ</dt>
            <dd>
              {datasetInfo.event} Phase 1 最終データ（{datasetInfo.datasetVersion}、{dateOnly(datasetInfo.frozenAt)} 固定）
            </dd>
          </div>
          <div>
            <dt>観測レコード</dt>
            <dd>{site.stats.recordCount}件</dd>
          </div>
          <div>
            <dt>範囲</dt>
            <dd>{datasetInfo.scope}</dd>
          </div>
        </dl>
        <p className="hint">地図は国土地理院「地球地図日本」をもとにした jpn-atlas（BSD-3-Clause）を加工して作成しています。離島の一部は省略し、沖縄県は位置・縮尺を変えて左上に表示しています。</p>
      </section>
    </>
  );
}
