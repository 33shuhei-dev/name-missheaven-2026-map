import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/data";
import { findDivision, sameNameDivisions, variantDivisions } from "@/lib/model";
import { CONFIDENCE_DESCRIPTION, SOURCE_TYPE_LABEL, UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { REGIONS } from "@/data/geo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConfidenceBadge } from "@/components/Badges";
import { RecordCard } from "@/components/RecordCard";
import { DivisionLink } from "@/components/DivisionLink";
import { ExternalLink } from "@/components/ExternalLink";

export const dynamicParams = false;

export function generateStaticParams() {
  return site.divisions.map((d) => ({ id: d.id }));
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const d = findDivision(site, id);
  return { title: d ? `${d.categoryOriginal}（${d.prefectureName}）` : "部門" };
}

export default async function DivisionPage({ params }: Params) {
  const { id } = await params;
  const d = findDivision(site, id);
  if (!d) notFound();

  const pref = site.prefectures.find((p) => p.slug === d.prefSlug);
  const region = REGIONS.find((r) => r.id === pref?.regionId);
  const areaLabel = d.area ?? UNKNOWN_AREA_LABEL;
  const sameName = sameNameDivisions(site, d);
  const variants = variantDivisions(site, d);
  const onlyCandidates = d.records.every((r) => r.dataset === "candidate");
  const sources = [
    ...new Map(
      d.records.filter((r) => r.sourceUrl).map((r) => [r.sourceUrl!, r] as const),
    ).values(),
  ];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "全国", href: "/" },
          ...(region ? [{ label: region.name }] : []),
          { label: d.prefectureName, href: `/pref/${d.prefSlug}` },
          { label: areaLabel, href: `/pref/${d.prefSlug}/area/${d.areaId}` },
          { label: d.categoryOriginal },
        ]}
      />
      <p className="eyebrow">部門</p>
      <h1 className="division-title">{d.categoryOriginal}</h1>

      <dl className="facts">
        <div>
          <dt>都道府県</dt>
          <dd>
            <Link href={`/pref/${d.prefSlug}`}>{d.prefectureName}</Link>
          </dd>
        </div>
        <div>
          <dt>エリア</dt>
          <dd>
            <Link href={`/pref/${d.prefSlug}/area/${d.areaId}`}>{areaLabel}</Link>
          </dd>
        </div>
        <div>
          <dt>確認状態</dt>
          <dd>
            <ConfidenceBadge value={d.confidence} />
            <span className="facts__desc">{CONFIDENCE_DESCRIPTION[d.confidence]}</span>
          </dd>
        </div>
        <div>
          <dt>店舗</dt>
          <dd>{d.storeNames.length > 0 ? d.storeNames.join("、") : <span className="muted">未判明</span>}</dd>
        </div>
      </dl>

      {onlyCandidates && (
        <p className="notice notice--warn">
          この部門の情報はすべて<strong>調査候補</strong>です。部門名・所在地・出場者は一次情報で確認できていません。
        </p>
      )}

      <section className="section" aria-labelledby="entrants-heading">
        <h2 id="entrants-heading">
          判明している出場者
          <span className="count">{d.entrantCount > 0 ? `${d.entrantCount}名` : "未判明"}</span>
        </h2>
        <p className="hint">
          {d.entrantCount === 0
            ? "この部門の出場者はまだ判明していません。"
            : "各出場者の確認状態は、それぞれの表示をご確認ください。"}
        </p>
        <div className="list">
          {d.records.map((r) => (
            <RecordCard key={r.id} record={r} showContext={false} />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="sources-heading">
        <h2 id="sources-heading">確認元</h2>
        {sources.length > 0 ? (
          <ul className="plain-list">
            {sources.map((r) => (
              <li key={r.sourceUrl}>
                <ExternalLink href={r.sourceUrl} label={SOURCE_TYPE_LABEL[r.sourceType]} />
                {r.checkedAt && <span className="muted"> {r.checkedAt} 確認</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">確認元（URL）はまだ登録されていません。</p>
        )}
      </section>

      {sameName.length > 0 && (
        <section className="section" aria-labelledby="same-heading">
          <h2 id="same-heading">同じ部門名がある他の地域</h2>
          <div className="list">
            {sameName.map((x) => (
              <DivisionLink key={x.id} division={x} showPlace />
            ))}
          </div>
        </section>
      )}

      {variants.length > 0 && (
        <section className="section" aria-labelledby="variant-heading">
          <h2 id="variant-heading">表記が似ている部門</h2>
          <p className="hint">
            記号やカナ表記の違いを除くと同じ名前になる部門です。同じ部門であるとは確認していません。
          </p>
          <div className="list">
            {variants.map((x) => (
              <DivisionLink key={x.id} division={x} showPlace />
            ))}
          </div>
        </section>
      )}

      <p>
        <Link href={`/search?q=${encodeURIComponent(d.categoryOriginal)}`} className="button button--ghost">
          「{d.categoryOriginal}」で全国検索
        </Link>
      </p>
    </>
  );
}
