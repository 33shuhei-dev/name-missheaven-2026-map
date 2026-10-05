import Link from "next/link";
import type { SiteRecord } from "@/data/types";
import { UNKNOWN_PREFECTURE_LABEL } from "@/data/geo";
import {
  ACCESS_STATUS_LABEL,
  CONFIDENCE_LABEL,
  SOURCE_TYPE_LABEL,
  UNKNOWN_AREA_LABEL,
} from "@/lib/labels";
import { areaIdOf, divisionIdOf, prefSlugOf } from "@/lib/model";
import { dateOnly } from "@/lib/phase1";
import { ConfidenceBadge } from "./Badges";
import { ExternalLink } from "./ExternalLink";

interface Props {
  record: SiteRecord;
  /** この観測が接続されている Phase 3 店舗ID（なければ店名はリンクにしない） */
  storeId?: string;
  /** 部門名・所在地を表示するか（部門ページ内では不要） */
  showContext?: boolean;
}

/**
 * 1件の観測を表示するカード。欠けている項目は「未判明」と表示し、推測で埋めない。
 * 情報源の全文・画像は複製せず、リンクと必要最小限の事実だけを表示する。
 */
export function RecordCard({ record: r, storeId, showContext = true }: Props) {
  const prefSlug = prefSlugOf(r);
  const divisionHref = `/division/${divisionIdOf(prefSlug, r.listingArea, r.categoryOriginal)}`;
  const placeHref = r.listingArea ? `/pref/${prefSlug}/area/${areaIdOf(prefSlug, r.listingArea)}` : `/pref/${prefSlug}`;
  const access = r.sourceAccessStatus ? ACCESS_STATUS_LABEL[r.sourceAccessStatus] : undefined;
  const checked = dateOnly(r.checkedAt);
  const hasLinks = !!(r.entrantUrl || r.storeUrl || r.sourceUrl || r.regionSourceUrl);

  return (
    <article id={r.id} className={`card record record--${r.confidence}`}>
      <div className="record__badges">
        <ConfidenceBadge value={r.confidence} />
        {(r.categoryConfidence || r.regionConfidence) && (
          <span className="record__sub-conf">
            {r.categoryConfidence && <>部門名：{CONFIDENCE_LABEL[r.categoryConfidence]}</>}
            {r.categoryConfidence && r.regionConfidence && " ／ "}
            {r.regionConfidence && <>地域：{CONFIDENCE_LABEL[r.regionConfidence]}</>}
          </span>
        )}
      </div>

      {showContext && (
        <>
          <p className="record__category">
            <Link href={divisionHref}>{r.categoryOriginal}</Link>
          </p>
          <p className="record__place">
            <Link href={placeHref}>
              {r.prefecture ?? UNKNOWN_PREFECTURE_LABEL} / {r.listingArea ?? UNKNOWN_AREA_LABEL}
            </Link>
          </p>
        </>
      )}

      <dl className="record__fields">
        <div>
          <dt>店舗</dt>
          <dd>
            {r.storeName && storeId ? (
              <Link href={`/store/${storeId}`}>{r.storeName}</Link>
            ) : r.storeName ? (
              r.storeName
            ) : (
              <span className="muted">未判明</span>
            )}
          </dd>
        </div>
        <div>
          <dt>出場者</dt>
          <dd>{r.entrantNames.length > 0 ? r.entrantNames.join("、") : <span className="muted">未判明</span>}</dd>
        </div>
        {!showContext && (
          <div>
            <dt>掲載地域</dt>
            <dd>{r.listingArea ?? <span className="muted">未判明</span>}</dd>
          </div>
        )}
        <div>
          <dt>情報源</dt>
          <dd>
            {r.sourceUrl ? SOURCE_TYPE_LABEL[r.sourceType] : <span className="muted">未登録</span>}
            {access && <span className="record__meta">{access}</span>}
            {checked && <span className="record__meta">{checked} 確認</span>}
          </dd>
        </div>
      </dl>

      {hasLinks && (
        <div className="record__links">
          <ExternalLink href={r.entrantUrl} label="本人ページ" />
          <ExternalLink href={r.storeUrl} label="店舗ページ" />
          <ExternalLink href={r.sourceUrl} label="部門の情報源" />
          {r.regionSourceUrl !== r.sourceUrl && (
            <ExternalLink
              href={r.regionSourceUrl}
              label={`地域の情報源${r.regionSourceType ? `（${SOURCE_TYPE_LABEL[r.regionSourceType]}）` : ""}`}
            />
          )}
        </div>
      )}

      {r.notes && (
        <details className="record__notes">
          <summary>根拠・留保（調査メモ）</summary>
          <p>{r.notes}</p>
        </details>
      )}
    </article>
  );
}
