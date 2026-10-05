import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/data";
import { findDivision, sameNameDivisions, variantDivisions } from "@/lib/model";
import { CONFIDENCE_DESCRIPTION, UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { REGIONS } from "@/data/geo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConfidenceBadge } from "@/components/Badges";
import { RecordCard } from "@/components/RecordCard";
import { DivisionLink } from "@/components/DivisionLink";
import { StoreRow } from "@/components/StoreRow";

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
  const areaLabel = d.listingArea ?? UNKNOWN_AREA_LABEL;
  const sameName = sameNameDivisions(site, d);
  const variants = variantDivisions(site, d);
  const formal = [...new Set(d.records.map((r) => r.formalElectionArea).filter(Boolean))];

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
      <p className="eyebrow">部門（掲載原文）</p>
      <h1 className="division-title">{d.categoryOriginal}</h1>

      <dl className="facts">
        <div>
          <dt>都道府県</dt>
          <dd>
            <Link href={`/pref/${d.prefSlug}`}>{d.prefectureName}</Link>
          </dd>
        </div>
        <div>
          <dt>掲載地域</dt>
          <dd>
            <Link href={`/pref/${d.prefSlug}/area/${d.areaId}`}>{areaLabel}</Link>
          </dd>
        </div>
        <div>
          <dt>正式選挙エリア</dt>
          <dd>
            {formal.length > 0 ? formal.join("、") : <span className="muted">未確認（掲載地域とは別の情報です）</span>}
          </dd>
        </div>
        <div>
          <dt>確認状態</dt>
          <dd>
            <ConfidenceBadge value={d.confidence} />
            <span className="facts__desc">{CONFIDENCE_DESCRIPTION[d.confidence]}</span>
          </dd>
        </div>
      </dl>

      {d.confidence !== "confirmed" && (
        <p className="notice notice--warn">
          この部門の情報は<strong>候補情報</strong>のみです。部門名・地域・店舗の関係は確認しきれていません。各情報の根拠・留保をご確認ください。
        </p>
      )}

      <section className="section" aria-labelledby="store-heading">
        <h2 id="store-heading">
          店舗<span className="count">{d.stores.length ? `見つかった範囲 ${d.stores.length}店` : ""}</span>
        </h2>
        {d.stores.length ? (
          <div className="list">
            {d.stores.map((st) => (
              <StoreRow
                key={st.id}
                store={{ id: st.id, name: st.name, hasPublicUrl: st.hasPublicUrl }}
                confidence={st.relationConfidence}
                showArea={false}
              />
            ))}
          </div>
        ) : (
          <p className="empty">この部門に関係する店舗はまだ確認できていません。</p>
        )}
        <p className="hint hint--tight">確認状態は「店舗とこの部門の関係」の確認状態です。</p>
      </section>

      {d.records.length > 0 && (
      <section className="section" aria-labelledby="obs-heading">
        <h2 id="obs-heading">
          部門の観測と情報源<span className="count">{d.records.length}件</span>
        </h2>
        <p className="hint">
          出場者 {d.entrantCount > 0 ? `${d.entrantCount}名` : "未判明"}（公開情報で見つかった範囲）。観測ごとに確認状態と情報源を表示しています。
        </p>
        <div className="list">
          {d.records.map((r) => (
            <RecordCard key={r.id} record={r} storeId={site.storeIdByRecord[r.id]} showContext={false} />
          ))}
        </div>
      </section>
      )}

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
          <p className="hint">記号・絵文字・カナ表記の違いを除くと同じ名前になる部門です。同じ部門であるとは確認していません。</p>
          <div className="list">
            {variants.map((x) => (
              <DivisionLink key={x.id} division={x} showPlace />
            ))}
          </div>
        </section>
      )}

      <p className="section">
        <Link href={`/search?q=${encodeURIComponent(d.categoryOriginal)}`} className="button button--ghost">
          この部門名で全国検索
        </Link>
      </p>
    </>
  );
}
