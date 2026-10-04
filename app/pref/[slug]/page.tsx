import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/data";
import { findPrefectureView } from "@/lib/model";
import { PREFECTURES, REGIONS, UNKNOWN_PREFECTURE_SLUG, prefecturesInRegion } from "@/data/geo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SearchBox } from "@/components/SearchBox";
import { DivisionLink } from "@/components/DivisionLink";

export const dynamicParams = false;

export function generateStaticParams() {
  return [...PREFECTURES.map((p) => ({ slug: p.slug })), { slug: UNKNOWN_PREFECTURE_SLUG }];
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const pref = findPrefectureView(site, slug);
  return { title: pref?.name ?? "都道府県未判明" };
}

export default async function PrefecturePage({ params }: Params) {
  const { slug } = await params;
  const pref = findPrefectureView(site, slug);

  // 都道府県未判明ページは、該当データがない場合は空表示にする
  if (!pref) {
    if (slug !== UNKNOWN_PREFECTURE_SLUG) notFound();
    return (
      <>
        <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "都道府県未判明" }]} />
        <h1>都道府県未判明の情報</h1>
        <p className="empty">現在、都道府県が未判明の情報はありません。</p>
      </>
    );
  }

  const region = REGIONS.find((r) => r.id === pref.regionId);
  const neighbors = region ? prefecturesInRegion(region.id).filter((p) => p.slug !== pref.slug) : [];
  const isUnknown = pref.slug === UNKNOWN_PREFECTURE_SLUG;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "全国", href: "/" },
          ...(region ? [{ label: region.name }] : []),
          { label: pref.name },
        ]}
      />
      <h1>{isUnknown ? "都道府県未判明の情報" : pref.name}</h1>
      {isUnknown && (
        <p className="hint">部門名だけ判明しているなど、都道府県がまだ分かっていない情報です。</p>
      )}
      <p className="summary-line">
        エリア {pref.areas.length} ・ 部門 {pref.divisionCount} ・ 情報 {pref.recordCount}件
      </p>

      {pref.recordCount > 0 && <SearchBox pref={pref.slug} placeholder={`${pref.name}の中で検索`} />}

      {pref.recordCount === 0 ? (
        <div className="empty">
          <p>{pref.name}の情報はまだ登録されていません。</p>
          <p>
            <Link href="/">全国から探す</Link>
          </p>
        </div>
      ) : (
        <section className="section" aria-labelledby="areas-heading">
          <h2 id="areas-heading">エリア</h2>
          {pref.areas.map((a) => (
            <section key={a.id} className="area-block">
              <Link href={`/pref/${pref.slug}/area/${a.id}`} className="area-block__head">
                <span>
                  <span className="area-block__name">{a.label}</span>
                  <span className="row-link__sub">
                    部門 {a.divisions.length} ・ 情報 {a.recordCount}件
                  </span>
                </span>
                <span aria-hidden="true">›</span>
              </Link>
              {a.divisions.length > 0 && (
                <div className="list">
                  {a.divisions.map((d) => (
                    <DivisionLink key={d.id} division={d} />
                  ))}
                </div>
              )}
              {a.uncategorized.length > 0 && (
                <p className="hint">
                  <Link href={`/pref/${pref.slug}/area/${a.id}`}>
                    部門未判明の情報 {a.uncategorized.length}件を見る
                  </Link>
                </p>
              )}
            </section>
          ))}
        </section>
      )}

      {neighbors.length > 0 && region && (
        <section className="section">
          <h2>{region.name}のほかの都道府県</h2>
          <ul className="pref-grid">
            {neighbors.map((p) => {
              const count = findPrefectureView(site, p.slug)?.recordCount ?? 0;
              return (
                <li key={p.slug}>
                  <Link
                    href={`/pref/${p.slug}`}
                    className={`pref-chip${count === 0 ? " pref-chip--empty" : ""}`}
                  >
                    <span>{p.name}</span>
                    <span className="pref-chip__count">{count}</span>
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
