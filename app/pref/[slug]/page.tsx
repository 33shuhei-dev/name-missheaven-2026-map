import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/data";
import { entrantHref, findPrefectureView } from "@/lib/model";
import { MAP_STATUS_DESCRIPTION, UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { PREFECTURES, REGIONS, UNKNOWN_PREFECTURE_SLUG, prefecturesInRegion } from "@/data/geo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SearchBox } from "@/components/SearchBox";
import { DivisionLink } from "@/components/DivisionLink";
import { ConfidenceBadge, StatusBadge } from "@/components/Badges";

export const dynamicParams = false;

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
  const hasData = pref.recordCount > 0;

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
            について調査しましたが、現在公開情報から確認できた部門情報はありません。
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
              <dt>観測</dt>
              <dd>{s.recordCount}</dd>
            </div>
            <div>
              <dt>部門</dt>
              <dd>{s.categoryNameCount}</dd>
            </div>
            <div>
              <dt>掲載地域</dt>
              <dd>{s.listingAreaCount}</dd>
            </div>
            <div>
              <dt>店舗</dt>
              <dd>{s.storeCount}</dd>
            </div>
            <div>
              <dt>出場者</dt>
              <dd>{s.entrantCount}</dd>
            </div>
            <div>
              <dt>確認済み</dt>
              <dd>{s.byConfidence.confirmed}</dd>
            </div>
          </dl>
          <p className="hint">
            確認済み {s.byConfidence.confirmed}・有力情報 {s.byConfidence.probable}・未確認情報 {s.byConfidence.unverified}件。
            部門は部門名（原文）の種類数、出場者は店舗名×人物名の数です。
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
                      部門 {a.summary.categoryNameCount} ・ 店舗 {a.summary.storeCount} ・ 観測 {a.recordCount}件
                    </span>
                  </span>
                  <span aria-hidden="true" className="row-link__arrow">›</span>
                </Link>
                <div className="list">
                  {a.divisions.map((d) => (
                    <DivisionLink key={d.id} division={d} />
                  ))}
                </div>
              </section>
            ))}
          </section>

          {pref.stores.length > 0 && (
            <section className="section" aria-labelledby="stores-heading">
              <h2 id="stores-heading">
                店舗<span className="count">見つかった範囲 {pref.stores.length}店</span>
              </h2>
              <div className="list">
                {pref.stores.map((st) => (
                  <Link key={st.id} href={`/store/${st.id}`} className="row-link">
                    <span className="row-link__main">
                      <span className="row-link__title">{st.name}</span>
                      <span className="row-link__sub">
                        {(st.listingAreas.join("・") || UNKNOWN_AREA_LABEL) + ` ・ 部門 ${st.divisions.length}`}
                      </span>
                    </span>
                    <ConfidenceBadge value={st.confidence} small />
                  </Link>
                ))}
              </div>
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
                    <span className="pref-chip__count">{v.recordCount}</span>
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
