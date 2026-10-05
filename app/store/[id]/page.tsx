import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/data";
import { findStore } from "@/lib/model";
import {
  COUNT_TYPE_LABEL,
  PARTICIPATION_TYPE_LABEL,
  PUBLIC_URL_STATUS_NOTE,
  PUBLISHER_ROLE_LABEL,
  VERIFICATION_METHOD_LABEL,
  SOURCE_ACCESS_LABEL,
  SOURCE_TYPE_LABEL,
  STORE_CONFIDENCE_DESCRIPTION,
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
      <p className="eyebrow">ミスヘブン総選挙2026 出場情報のある店舗</p>
      <div className="page-head">
        <h1>{s.name}</h1>
        <ConfidenceBadge value={s.confidence} subject="store" />
      </div>
      <p className="store-place">
        <Link href={`/pref/${s.prefSlug}`}>{s.prefectureName}</Link>
        {s.listingAreas.map((a) => {
          const href = areaHref(a);
          return (
            <span key={a}>
              {" ・ "}
              {href ? <Link href={href}>{a}</Link> : a}
            </span>
          );
        })}
      </p>
      {s.nameOriginals.length > 1 && (
        <p className="hint hint--tight">情報源での表記：{s.nameOriginals.join(" ／ ")}</p>
      )}

      {/* 見つかった部門（部門名だけを見せる。確認状態は下の「参加情報の根拠」にまとめる） */}
      <section className="section store-cats" aria-labelledby="cat-heading">
        <h2 id="cat-heading">
          見つかった部門<span className="count">{s.categoryOriginals.length ? `${s.categoryOriginals.length}種類` : ""}</span>
        </h2>
        {s.categories.length ? (
          <>
            <ul className="fun-cats__list">
              {s.categories.map((c) => (
                <li key={`${c.relationId}-${c.divisionId}`}>
                  <Link href={`/division/${c.divisionId}`} className="fun-cat">
                    <span className="fun-cat__name">{c.categoryOriginal}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="hint hint--tight">確認できた情報に登場した部門名です。</p>
          </>
        ) : (
          <p className="hint hint--tight">この店舗の部門名はまだ見つかっていません。</p>
        )}
      </section>

      {/* 店舗公開ページ（詳しい出場者情報はこちらで確認してもらう）。URLがない店舗にはリンクを作らない */}
      <section className="section store-links" aria-labelledby="public-heading">
        <h2 id="public-heading" className="visually-hidden">
          店舗の公開ページ
        </h2>
        {publicUrl ? (
          <>
            <a className="store-cta" href={publicUrl} target="_blank" rel="noopener noreferrer nofollow ugc">
              <span>店舗の公開ページで詳しく見る</span>
              <span className="store-cta__sub">出場者の情報は店舗のページで確認できます</span>
              <span className="store-cta__host">{displayHost(publicUrl)} ↗ 外部サイトが開きます</span>
            </a>
            {publicNote && <p className="store-note">{publicNote}</p>}
          </>
        ) : (
          <p className="hint hint--tight">この店舗の公開ページはまだ登録されていません。</p>
        )}
      </section>

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
      </dl>

      {/* 参加根拠（店舗と2026ミスヘブンの関係を確認するURL。公開ページとは別） */}
      <section className="section" aria-labelledby="evidence-heading">
        <h2 id="evidence-heading">参加情報の根拠</h2>
        <div className="evidence">
          <p className="evidence__status">
            <ConfidenceBadge value={s.confidence} subject="store" small />
            <span>
              {s.verificationMethod
                ? STORE_CONFIDENCE_DESCRIPTION[s.confidence]
                : `${PARTICIPATION_TYPE_LABEL[s.participationType] ?? "参加関連の根拠あり"}。${STORE_CONFIDENCE_DESCRIPTION[s.confidence]}`}
            </span>
          </p>
          {s.origin !== "phase3" && (
            <p className="hint hint--tight">
              {s.origin === "phase3b" ? "全国の検索結果の走査で見つかった店舗です。" : "Phase 3 以降に追加した情報です。"}
            </p>
          )}
          <p className="evidence__label">根拠の種類：{evidenceKind}</p>
          {s.verificationMethod && VERIFICATION_METHOD_LABEL[s.verificationMethod] && (
            <p className="hint hint--tight">
              確認方法：{VERIFICATION_METHOD_LABEL[s.verificationMethod]}
              {typeof s.evidencePageCount === "number" && s.evidencePageCount > 1 && `（${s.evidencePageCount}ページ）`}
            </p>
          )}
          {!s.verificationMethod && s.evidenceSource && SOURCE_ACCESS_LABEL[s.evidenceSource.accessStatus] && (
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
