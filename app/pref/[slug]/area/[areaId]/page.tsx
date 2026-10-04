import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/data";
import { findPrefectureView } from "@/lib/model";
import { REGIONS } from "@/data/geo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DivisionLink } from "@/components/DivisionLink";
import { RecordCard } from "@/components/RecordCard";

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
  return { title: found ? `${found.area.label}（${found.pref.name}）` : "エリア" };
}

export default async function AreaPage({ params }: Params) {
  const { slug, areaId } = await params;
  const found = find(slug, areaId);
  if (!found) notFound();
  const { pref, area } = found;
  const region = REGIONS.find((r) => r.id === pref.regionId);

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
      <p className="eyebrow">{pref.name}</p>
      <h1>{area.label}</h1>
      <p className="summary-line">
        部門 {area.divisions.length} ・ 情報 {area.recordCount}件
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
          <p className="empty">このエリアで判明している部門はまだありません。</p>
        )}
      </section>

      {area.uncategorized.length > 0 && (
        <section className="section" aria-labelledby="uncat-heading">
          <h2 id="uncat-heading">部門未判明の情報</h2>
          <p className="hint">店舗や出場者は判明しているものの、部門が分かっていない情報です。</p>
          <div className="list">
            {area.uncategorized.map((r) => (
              <RecordCard key={r.id} record={r} />
            ))}
          </div>
        </section>
      )}

      <p>
        <Link href={`/pref/${pref.slug}`} className="button button--ghost">
          ‹ {pref.name}のエリア一覧へ戻る
        </Link>
      </p>
    </>
  );
}
