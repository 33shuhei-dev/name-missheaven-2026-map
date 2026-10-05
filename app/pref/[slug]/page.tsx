import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { campaignStoresIn, site } from "@/lib/data";
import { entrantHref, findPrefectureView } from "@/lib/model";
import { MAP_STATUS_DESCRIPTION } from "@/lib/labels";
import { PREFECTURES, REGIONS, UNKNOWN_PREFECTURE_SLUG, prefecturesInRegion } from "@/data/geo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SearchBox } from "@/components/SearchBox";
import { DivisionLink } from "@/components/DivisionLink";
import { ConfidenceBadge, StatusBadge } from "@/components/Badges";
import { StoreRow } from "@/components/StoreRow";
import { ExternalLink } from "@/components/ExternalLink";

export const dynamicParams = false;

/** 店舗一覧で最初に表示する件数（それ以上は折りたたみ） */
const STORE_PAGE = 30;

export function generateStaticParams() {
  return [...PREFECTURES.map((p) => ({ slug: p.slug })), { slug: UNKNOWN_PREFECTURE_SLUG }];
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const pref = findPrefectureView(site, slug);
  return { title: slug === UNKNOWN_PREFECTURE_SLUG ? "地域未判明の情報" : (pref?.name ?? "都道府県") };
}

export default async function PrefecturePage({ params }: Params) {
  const { slug } = await params;
  const isUnknown = slug === UNKNOWN_PREFECTURE_SLUG;
  const pref = findPrefectureView(site, slug);

  if (!pref) {
    if (!isUnknown) notFound();
    return (
      <>
        <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "地域未判明" }]} />
        <h1>地域未判明の情報</h1>
        <p className="empty">現在、都道府県が未判明の情報はありません。</p>
      </>
    );
  }

  const region = REGIONS.find((r) => r.id === pref.regionId);
  const neighbors = region ? prefecturesInRegion(region.id).filter((p) => p.slug !== pref.slug) : [];
  const s = pref.summary;
  const hasData = pref.recordCount > 0 || pref.stores.length > 0;
  const campaign = campaignStoresIn(isUnknown ? undefined : pref.name);

  return (
    <>
      <Breadcrumbs
        items={[{ label: "全国", href: "/" }, ...(region ? [{ label: region.name }] : []), { label: isUnknown ? "地域未判明" : pref.name }]}
      />
      <div className="page-head">
        <h1>{isUnknown ? "地域未判明の情報" : pref.name}</h1>
        {!isUnknown && <StatusBadge value={pref.status} />}
      </div>
      {isUnknown ? (
        <p className="notice">
          都道府県を確認できていない観測です。掲載地域名があっても、地名や店舗名から都道府県を推定していないため、地図には配置していません。
        </p>
      ) : (
        <p className="hint">{MAP_STATUS_DESCRIPTION[pref.status]}</p>
      )}

      {!hasData ? (
        <div className="empty empty--searched">
          <p>
            <strong>{pref.name}</strong>
            について調査しましたが、現在公開情報から確認できた部門・参加店舗の情報はありません。
          </p>
          <p className="hint">部門や出場者が存在しないという意味ではありません。新しい公開情報が確認できれば追加します。</p>
          <p>
            <Link href="/">全国地図に戻る</Link>
          </p>
        </div>
      ) : (
        <>
          <dl className="stats stats--compact">
            <div>
              <dt>掲載地域</dt>
              <dd>{pref.listingAreaCount}</dd>
            </div>
            <div>
              <dt>部門</dt>
              <dd>{pref.categoryNameCount}</dd>
            </div>
            <div>
              <dt>店舗</dt>
              <dd>{pref.storeSummary.storeCount}</dd>
            </div>
            <div>
              <dt>公開ページ</dt>
              <dd>{pref.storeSummary.publicUrlCount}</dd>
            </div>
            <div>
              <dt>観測</dt>
              <dd>{s.recordCount}</dd>
            </div>
            <div>
              <dt>出場者</dt>
              <dd>{s.entrantCount}</dd>
            </div>
          </dl>
          <p className="hint">
            店舗（候補を含む）の確認状態：確認済み {pref.storeSummary.byConfidence.confirmed}・有力情報 {pref.storeSummary.byConfidence.probable}・未確認情報{" "}
            {pref.storeSummary.byConfidence.unverified}。部門は部門名（原文）の種類数、出場者はこれまでの調査で記録した店舗名×人物名の数です。
            {s.lastCheckedAt && ` 最終確認日：${s.lastCheckedAt}`}
          </p>
          {pref.status === "candidate" && !isUnknown && (
            <p className="notice notice--warn">
              この県の情報は<strong>候補（有力情報・未確認情報）のみ</strong>です。確認済みの情報はまだありません。
            </p>
          )}

          <SearchBox pref={pref.slug} placeholder={`${isUnknown ? "地域未判明" : pref.name}の中で検索`} />

          <section className="section" aria-labelledby="areas-heading">
            <h2 id="areas-heading">掲載地域と部門</h2>
            <p className="hint">掲載地域は情報源に書かれた掲載・営業地域で、正式な選挙エリアではありません。</p>
            {pref.areas.map((a) => (
              <section key={a.id} className="area-block">
                <Link href={`/pref/${pref.slug}/area/${a.id}`} className="area-block__head">
                  <span>
                    <span className="area-block__name">{a.label}</span>
                    <span className="row-link__sub">
                      部門 {a.categoryNameCount} ・ 店舗 {a.stores.length}
                    </span>
                  </span>
                  <span aria-hidden="true" className="row-link__arrow">›</span>
                </Link>
                <div className="list">
                  {a.divisions.map((d) => (
                    <DivisionLink key={d.id} division={d} />
                  ))}
                </div>
                {a.stores.filter((st) => st.categories.length === 0).length > 0 && (
                  <p className="hint hint--tight">
                    <Link href={`/pref/${pref.slug}/area/${a.id}`}>
                      部門未確認の店舗 {a.stores.filter((st) => st.categories.length === 0).length}店を見る
                    </Link>
                  </p>
                )}
              </section>
            ))}
          </section>

          {pref.stores.length > 0 && (
            <section className="section" aria-labelledby="stores-heading">
              <h2 id="stores-heading">
                店舗<span className="count">見つかった範囲 {pref.stores.length}店（候補を含む）</span>
              </h2>
              <p className="hint">公開情報から2026年の参加に関係する根拠を見つけた店舗です。全参加店舗の一覧ではありません。</p>
              <div className="list">
                {pref.stores.slice(0, STORE_PAGE).map((st) => (
                  <StoreRow key={st.id} store={st} confidence={st.confidence} />
                ))}
              </div>
              {pref.stores.length > STORE_PAGE && (
                <details className="more-list">
                  <summary>残りの店舗を表示（{pref.stores.length - STORE_PAGE}店）</summary>
                  <div className="list">
                    {pref.stores.slice(STORE_PAGE).map((st) => (
                      <StoreRow key={st.id} store={st} confidence={st.confidence} />
                    ))}
                  </div>
                </details>
              )}
            </section>
          )}

          {pref.entrants.length > 0 && (
            <section className="section" aria-labelledby="entrants-heading">
              <h2 id="entrants-heading">
                出場者<span className="count">見つかった範囲 {pref.entrants.length}名</span>
              </h2>
              <p className="hint">公開情報から確認できた範囲のみです。全出場者の一覧ではありません。</p>
              <ul className="entrant-list">
                {pref.entrants.map((e) => (
                  <li key={e.id}>
                    <Link href={entrantHref(e)} className="entrant-row">
                      <span className="entrant-row__name">{e.name}</span>
                      <span className="entrant-row__sub">
                        {[e.storeName ?? "店舗未判明", e.divisions.map((d) => d.categoryOriginal).join("、")].join(" ・ ")}
                      </span>
                      <ConfidenceBadge value={e.confidence} small />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="hint section">
            正式な選挙エリアは確認できていません。候補情報は、各観測の「根拠・留保」もあわせてご確認ください。
          </p>
        </>
      )}

      {campaign.length > 0 && (
        <section className="section" aria-labelledby="campaign-heading">
          <h2 id="campaign-heading">応援キャンペーンのみ確認された店舗</h2>
          <p className="hint">2026年の応援キャンペーンは確認できましたが、出場エントリーは未確認のため、上の店舗数・地図の状態には含めていません。</p>
          <ul className="plain-list">
            {campaign.map((c) => (
              <li key={c.storeId} className="campaign">
                <strong>{c.storeName}</strong>
                {c.listingArea && <span className="muted">（{c.listingArea}）</span>}
                <ExternalLink href={c.storePublicUrl ?? undefined} label="店舗の公開ページ" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {neighbors.length > 0 && region && (
        <section className="section">
          <h2>{region.name}のほかの都道府県</h2>
          <ul className="pref-grid">
            {neighbors.map((p) => {
              const v = findPrefectureView(site, p.slug)!;
              return (
                <li key={p.slug}>
                  <Link href={`/pref/${p.slug}`} className={`pref-chip pref-chip--${v.status}`}>
                    <span className={`legend__swatch legend__swatch--${v.status}`} aria-hidden="true" />
                    <span className="pref-chip__name">{p.name}</span>
                    <span className="pref-chip__count">{v.stores.length}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
