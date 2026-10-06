import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/data";
import { findPrefectureView } from "@/lib/model";
import { REGIONS, UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DivisionLink } from "@/components/DivisionLink";
import { StoreRow } from "@/components/StoreRow";

export const dynamicParams = false;

export function generateStaticParams() {
  const prefs = site.unknownPrefecture ? [...site.prefectures, site.unknownPrefecture] : site.prefectures;
  return prefs.flatMap((p) => p.areas.map((a) => ({ slug: p.slug, areaId: a.id })));
}

type Params = { params: Promise<{ slug: string; areaId: string }> };

function find(slug: string, areaId: string) {
  const pref = findPrefectureView(site, slug);
  const area = pref?.areas.find((a) => a.id === areaId);
  return pref && area ? { pref, area } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, areaId } = await params;
  const found = find(slug, areaId);
  return { title: found ? `${found.area.label}（${found.pref.name}）` : "掲載地域" };
}

export default async function AreaPage({ params }: Params) {
  const { slug, areaId } = await params;
  const found = find(slug, areaId);
  if (!found) notFound();
  const { pref, area } = found;
  const region = REGIONS.find((r) => r.id === pref.regionId);
  const isUnknownPref = pref.slug === UNKNOWN_PREFECTURE_SLUG;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "全国", href: "/" },
          ...(region ? [{ label: region.name }] : []),
          { label: pref.name, href: `/pref/${pref.slug}` },
          { label: area.label },
        ]}
      />
      <p className="eyebrow">掲載地域 ・ {pref.name}</p>
      <h1>{area.label}</h1>
      <p className="summary-line">
        部門 {area.categoryNameCount} ・ 店舗 {area.stores.length}
      </p>
      <p className="hint">
        掲載地域は情報源に書かれた掲載・営業地域です。正式な選挙エリアではありません。
        {isUnknownPref && area.name && " 都道府県は確認できていないため、地名から推定していません。"}
      </p>

      <section className="section" aria-labelledby="div-heading">
        <h2 id="div-heading">部門</h2>
        {area.divisions.length > 0 ? (
          <div className="list">
            {area.divisions.map((d) => (
              <DivisionLink key={d.id} division={d} />
            ))}
          </div>
        ) : (
          <p className="empty">この掲載地域で確認できた部門はまだありません。</p>
        )}
      </section>

      <section className="section" aria-labelledby="store-heading">
        <h2 id="store-heading">
          店舗<span className="count">{area.stores.length ? `見つかった範囲 ${area.stores.length}店` : ""}</span>
        </h2>
        {area.stores.length > 0 ? (
          <div className="list">
            {area.stores.map((st) => (
              <StoreRow key={st.id} store={st} confidence={st.confidence} showArea={false} />
            ))}
          </div>
        ) : (
          <p className="empty">この掲載地域で確認できた店舗はまだありません。</p>
        )}
      </section>

      <p className="section">
        <Link href={`/pref/${pref.slug}`} className="button button--ghost">
          ‹ {pref.name}へ戻る
        </Link>
      </p>
    </>
  );
}
