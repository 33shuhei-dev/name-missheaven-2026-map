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
  STORE_CONFIDENCE_DESCRIPTION,
  STORE_CONFIDENCE_LABEL,
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
        <h2>店舗の参加情報</h2>
        <p>
          参加店舗は、2026年の参加をどこまで確認できているかで3つに分けて表示しています。店舗のページ（ヘブン掲載の店舗トップ・在籍ページ・日記など）の検索結果に「ミスヘブン」「2026」と、エントリー・ノミネート・出場・部門などの具体的な参加の記載があるものを参加情報として数えています。投票の案内や大会の一般告知だけのものは含めていません。
        </p>
        <ul className="plain-list">
          {CONFIDENCE_ORDER.map((c) => (
            <li key={c}>
              <ConfidenceBadge value={c} subject="store" />
              <span className="plain-list__desc">{STORE_CONFIDENCE_DESCRIPTION[c]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section card prose">
        <h2>観測の確認状態</h2>
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
          <li>「店舗」の数は2026年の参加情報（参加確認済み・参加情報あり・参加情報を1件確認）を見つけた店舗の数で、全参加店舗の数ではありません。応援キャンペーンのみ確認された店舗は含めていません。</li>
          <li>店舗の「公開ページ」は店舗を見るためのリンク、「参加の根拠」は2026年の参加との関係を確認したページで、別のものです。</li>
          <li>人数は、WEB申込の掲載人数・店舗が告知したエントリー人数など、種類を明記できるものだけを店舗ページに表示しています。不明な人数は0人とせず表示しません。</li>
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
            <dd>{site.stats.recordCount}件（Phase 1：都道府県・掲載地域・部門・店舗・出場者の観測）</dd>
          </div>
          <div>
            <dt>参加関連店舗</dt>
            <dd>
              {site.stats.stores.storeCount}店（{STORE_CONFIDENCE_LABEL.confirmed} {site.stats.stores.byConfidence.confirmed}・
              {STORE_CONFIDENCE_LABEL.probable} {site.stats.stores.byConfidence.probable}・{STORE_CONFIDENCE_LABEL.unverified}{" "}
              {site.stats.stores.byConfidence.unverified}）
              {datasetInfo.phase3CheckedAt && `、${datasetInfo.phase3CheckedAt} 時点`}
            </dd>
          </div>
          <div>
            <dt>店舗×部門</dt>
            <dd>{site.stats.stores.relationCount}組（1店舗が複数の部門に関係することがあります）</dd>
          </div>
          {datasetInfo.nationalApproximateScale && (
            <div>
              <dt>参加規模</dt>
              <dd>
                公式媒体の案内では約{datasetInfo.nationalApproximateScale.toLocaleString("ja-JP")}人（概数。確定した参加者数ではありません。Phase 2）
              </dd>
            </div>
          )}
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
