import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/data";
import { findStore } from "@/lib/model";
import { UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { REGIONS } from "@/data/geo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConfidenceBadge } from "@/components/Badges";
import { RecordCard } from "@/components/RecordCard";

export const dynamicParams = false;

export function generateStaticParams() {
  return site.stores.map((s) => ({ id: s.id }));
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const s = findStore(site, id);
  return { title: s ? `${s.name}（${s.prefectureName}）` : "店舗" };
}

export default async function StorePage({ params }: Params) {
  const { id } = await params;
  const s = findStore(site, id);
  if (!s) notFound();
  const pref = site.prefectures.find((p) => p.slug === s.prefSlug);
  const region = REGIONS.find((r) => r.id === pref?.regionId);
  const entrants = site.entrants.filter((e) => e.storeId === s.id);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "全国", href: "/" },
          ...(region ? [{ label: region.name }] : []),
          { label: s.prefectureName, href: `/pref/${s.prefSlug}` },
          { label: s.name },
        ]}
      />
      <p className="eyebrow">店舗（掲載名）</p>
      <h1>{s.name}</h1>

      <dl className="facts">
        <div>
          <dt>都道府県</dt>
          <dd>
            <Link href={`/pref/${s.prefSlug}`}>{s.prefectureName}</Link>
          </dd>
        </div>
        <div>
          <dt>掲載地域</dt>
          <dd>{s.listingAreas.length ? s.listingAreas.join("、") : <span className="muted">{UNKNOWN_AREA_LABEL}</span>}</dd>
        </div>
        <div>
          <dt>確認状態</dt>
          <dd>
            <ConfidenceBadge value={s.confidence} />
            <span className="facts__desc">この店舗に関する観測のうち最も確度の高いもの</span>
          </dd>
        </div>
      </dl>

      <section className="section" aria-labelledby="div-heading">
        <h2 id="div-heading">部門と出場者</h2>
        <p className="hint">公開情報から見つかった範囲です。この店舗の全出場者・全部門ではありません。</p>
        {entrants.length > 0 && (
          <ul className="entrant-list">
            {entrants.map((e) => (
              <li key={e.id} id={e.id} className="entrant-row entrant-row--static">
                <span className="entrant-row__name">{e.name}</span>
                <span className="entrant-row__sub inline-links">
                  {e.divisions.map((d) => (
                    <Link key={d.id} href={`/division/${d.id}`}>
                      {d.categoryOriginal}
                    </Link>
                  ))}
                </span>
                <ConfidenceBadge value={e.confidence} small />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="obs-heading">
        <h2 id="obs-heading">
          観測と情報源<span className="count">{s.records.length}件</span>
        </h2>
        <div className="list">
          {s.records.map((r) => (
            <RecordCard key={r.id} record={r} />
          ))}
        </div>
      </section>
    </>
  );
}
