import Link from "next/link";
import type { DataRecord } from "@/data/types";
import { UNKNOWN_PREFECTURE_LABEL } from "@/data/geo";
import { SOURCE_TYPE_LABEL, UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { areaIdOf, divisionIdOf, prefSlugOf } from "@/lib/model";
import { ConfidenceBadge, DatasetBadge } from "./Badges";
import { ExternalLink } from "./ExternalLink";

interface Props {
  record: DataRecord;
  /** 部門名・所在地を表示するか（部門詳細ページ内では不要） */
  showContext?: boolean;
}

/** 1件の情報を表示するカード。欠けている項目は「未判明」として表示し、壊れない。 */
export function RecordCard({ record: r, showContext = true }: Props) {
  const prefSlug = prefSlugOf(r);
  const divisionHref = r.categoryOriginal
    ? `/division/${divisionIdOf(prefSlug, r.area, r.categoryOriginal)}`
    : null;
  const placeHref = r.area
    ? `/pref/${prefSlug}/area/${areaIdOf(prefSlug, r.area)}`
    : `/pref/${prefSlug}`;
  const hasLinks = !!(r.entrantUrl || r.storeUrl || r.sourceUrl);

  return (
    <article className={`card record record--${r.confidence}`}>
      <div className="record__badges">
        <ConfidenceBadge value={r.confidence} />
        <DatasetBadge value={r.dataset} />
      </div>

      {showContext && (
        <>
          <p className="record__category">
            {divisionHref ? (
              <Link href={divisionHref}>{r.categoryOriginal}</Link>
            ) : (
              <span className="muted">部門未判明</span>
            )}
          </p>
          <p className="record__place">
            <Link href={placeHref}>
              {r.prefecture ?? UNKNOWN_PREFECTURE_LABEL}
              {" / "}
              {r.area ?? UNKNOWN_AREA_LABEL}
            </Link>
          </p>
        </>
      )}

      <dl className="record__fields">
        <div>
          <dt>出場者</dt>
          <dd>{r.entrantName ?? <span className="muted">未判明</span>}</dd>
        </div>
        <div>
          <dt>店舗</dt>
          <dd>{r.storeName ?? <span className="muted">未判明</span>}</dd>
        </div>
        <div>
          <dt>確認元</dt>
          <dd>
            {r.sourceUrl ? SOURCE_TYPE_LABEL[r.sourceType] : <span className="muted">未登録</span>}
            {r.checkedAt && <span className="muted">（{r.checkedAt} 確認）</span>}
          </dd>
        </div>
      </dl>

      {r.notes && <p className="record__notes">{r.notes}</p>}

      {hasLinks && (
        <div className="record__links">
          <ExternalLink href={r.entrantUrl} label="本人ページ" />
          <ExternalLink href={r.storeUrl} label="店舗ページ" />
          <ExternalLink href={r.sourceUrl} label="確認元" />
        </div>
      )}
    </article>
  );
}
