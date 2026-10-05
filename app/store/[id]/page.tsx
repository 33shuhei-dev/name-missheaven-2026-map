import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/data";
import { findStore } from "@/lib/model";
import {
  CONFIDENCE_DESCRIPTION,
  COUNT_TYPE_LABEL,
  PARTICIPATION_TYPE_LABEL,
  PUBLIC_URL_STATUS_NOTE,
  PUBLISHER_ROLE_LABEL,
  SOURCE_ACCESS_LABEL,
  SOURCE_TYPE_LABEL,
  UNKNOWN_AREA_LABEL,
} from "@/lib/labels";
import { displayHost, safeExternalUrl } from "@/lib/links";
import { REGIONS, UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConfidenceBadge } from "@/components/Badges";
import { ExternalLink } from "@/components/ExternalLink";
import { RecordCard } from "@/components/RecordCard";

export const dynamicParams = false;

/** Phase 3 の storeId に加え、v1 までの店舗URL（都道府県×店名のID）も引き続き表示できるようにする */
export function generateStaticParams() {
  return site.stores.flatMap((s) => [{ id: s.id }, ...s.legacyIds.map((id) => ({ id }))]);
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const s = findStore(site, id);
  return {
    title: s ? `${s.name}（${s.prefectureName}）` : "店舗",
    ...(s && s.id !== id ? { alternates: { canonical: `/store/${s.id}` } } : {}),
  };
}

export default async function StorePage({ params }: Params) {
  const { id } = await params;
  const s = findStore(site, id);
  if (!s) notFound();
  const pref = site.prefectures.find((p) => p.slug === s.prefSlug);
  const region = REGIONS.find((r) => r.id === pref?.regionId);
  const entrants = site.entrants.filter((e) => e.storeId === s.id);
  const publicUrl = safeExternalUrl(s.storePublicUrl);
  const publicNote = s.publicUrlAccessStatus ? PUBLIC_URL_STATUS_NOTE[s.publicUrlAccessStatus] : null;
  const areaHref = (area?: string) => {
    const a = (s.prefSlug === UNKNOWN_PREFECTURE_SLUG ? site.unknownPrefecture : pref)?.areas.find((x) => x.name === area);
    return a ? `/pref/${s.prefSlug}/area/${a.id}` : null;
  };
  const evidenceKind =
    (s.evidenceSource && PUBLISHER_ROLE_LABEL[s.evidenceSource.publisherRole]) ??
    (s.sourceType === "official" ? "ヘブン掲載の店舗告知（運営による一覧ではありません）" : SOURCE_TYPE_LABEL[s.sourceType]);
  const counts = s.countFacts.filter((c) => COUNT_TYPE_LABEL[c.countType]);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "全国", href: "/" },
          ...(region ? [{ label: region.name }] : []),
          { label: s.prefectureName, href: `/pref/${s.prefSlug}` },
          ...(s.listingAreas.length === 1 && areaHref(s.listingAreas[0])
            ? [{ label: s.listingAreas[0], href: areaHref(s.listingAreas[0])! }]
            : []),
          { label: s.name },
        ]}
      />
      <p className="eyebrow">参加関連店舗{s.origin === "update" ? "（Phase 3 以降の追加情報）" : ""}</p>
      <div className="page-head">
        <h1>{s.name}</h1>
        <ConfidenceBadge value={s.confidence} />
      </div>
      {s.nameOriginals.length > 1 && (
        <p className="hint hint--tight">情報源での表記：{s.nameOriginals.join(" ／ ")}</p>
      )}

      {/* 店舗公開ページ（利用者が店舗を見るためのURL） */}
      <div className="store-links">
        {publicUrl ? (
          <a className="store-cta" href={publicUrl} target="_blank" rel="noopener noreferrer nofollow ugc">
            <span>店舗の公開ページを見る</span>
            <span className="store-cta__host">{displayHost(publicUrl)} ↗</span>
          </a>
        ) : (
          <p className="store-cta store-cta--none">店舗公開ページのURLは未登録です</p>
        )}
        {publicUrl && publicNote && <p className="store-note">{publicNote}</p>}
      </div>

      <dl className="facts">
        <div>
          <dt>都道府県</dt>
          <dd>
            <Link href={`/pref/${s.prefSlug}`}>{s.prefectureName}</Link>
          </dd>
        </div>
        <div>
          <dt>掲載地域</dt>
          <dd>
            {s.listingAreas.length ? (
              <span className="inline-links">
                {s.listingAreas.map((a) => {
                  const href = areaHref(a);
                  return href ? (
                    <Link key={a} href={href}>
                      {a}
                    </Link>
                  ) : (
                    <span key={a}>{a}</span>
                  );
                })}
              </span>
            ) : (
              <span className="muted">{UNKNOWN_AREA_LABEL}</span>
            )}
          </dd>
        </div>
        <div>
          <dt>正式選挙エリア</dt>
          <dd>{s.formalElectionArea ?? <span className="muted">未確認（掲載地域とは別の情報です）</span>}</dd>
        </div>
        <div>
          <dt>確認状態</dt>
          <dd>
            <ConfidenceBadge value={s.confidence} />
            <span className="facts__desc">
              {PARTICIPATION_TYPE_LABEL[s.participationType] ?? "参加関連の根拠あり"}。{CONFIDENCE_DESCRIPTION[s.confidence]}
            </span>
          </dd>
        </div>
      </dl>

      <section className="section" aria-labelledby="cat-heading">
        <h2 id="cat-heading">
          関連する部門<span className="count">{s.categoryOriginals.length ? `${s.categoryOriginals.length}種類` : ""}</span>
        </h2>
        {s.categories.length ? (
          <ul className="chip-links">
            {s.categories.map((c) => (
              <li key={`${c.relationId}-${c.divisionId}`}>
                <Link href={`/division/${c.divisionId}`} className="place-link">
                  <span>{c.categoryOriginal}</span>
                  <ConfidenceBadge value={c.confidence} small />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">この店舗の部門はまだ確認できていません（部門未確認）。</p>
        )}
        <p className="hint hint--tight">部門名は情報源の原文です。店舗の全員がこの部門に出ているという意味ではありません。</p>
      </section>

      {/* 参加根拠（店舗と2026ミスヘブンの関係を確認するURL。公開ページとは別） */}
      <section className="section" aria-labelledby="evidence-heading">
        <h2 id="evidence-heading">参加の根拠</h2>
        <div className="evidence">
          <p className="evidence__label">根拠の種類：{evidenceKind}</p>
          {s.evidenceSource && SOURCE_ACCESS_LABEL[s.evidenceSource.accessStatus] && (
            <p className="hint hint--tight">確認方法：{SOURCE_ACCESS_LABEL[s.evidenceSource.accessStatus]}</p>
          )}
          {s.participationEvidenceUrl ? (
            <ExternalLink href={s.participationEvidenceUrl} label="根拠を見る" />
          ) : (
            <p className="muted">根拠URLは未登録です。</p>
          )}
        </div>
        {s.notes && (
          <details className="record__notes">
            <summary>根拠・留保（調査メモ）</summary>
            <p>{s.notes}</p>
          </details>
        )}
      </section>

      {counts.length > 0 && (
        <section className="section" aria-labelledby="count-heading">
          <h2 id="count-heading">人数の記載</h2>
          <ul className="plain-list">
            {counts.map((c) => (
              <li key={c.id} className="evidence">
                <p className="evidence__label">{COUNT_TYPE_LABEL[c.countType].label}</p>
                <p className="hint--tight">
                  <strong>{c.participantCount}</strong>
                </p>
                <p className="hint hint--tight">{COUNT_TYPE_LABEL[c.countType].note}</p>
                {c.sourceUrl && <ExternalLink href={c.sourceUrl} label="人数の根拠" />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {entrants.length > 0 && (
        <section className="section" aria-labelledby="ent-heading">
          <h2 id="ent-heading">出場者</h2>
          <p className="hint">これまでの調査で記録した範囲です。この店舗の全出場者ではありません。</p>
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
        </section>
      )}

      {s.records.length > 0 && (
        <details className="section more-list">
          <summary>部門の観測と情報源（{s.records.length}件）</summary>
          <div className="list">
            {s.records.map((r) => (
              <RecordCard key={r.id} record={r} storeId={s.id} />
            ))}
          </div>
        </details>
      )}
    </>
  );
}
