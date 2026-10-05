import Link from "next/link";
import type { Division } from "@/lib/model";
import { UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { ConfidenceBadge } from "./Badges";

/**
 * 部門カード。視覚的な優先順位：部門名 ＞ 確認状態 ＞ 店舗 ＞ 出場者数・所在地
 */
export function DivisionLink({
  division: d,
  showPlace = false,
  showArea = false,
}: {
  division: Division;
  showPlace?: boolean;
  showArea?: boolean;
}) {
  const place = [showPlace ? d.prefectureName : null, showPlace || showArea ? (d.listingArea ?? UNKNOWN_AREA_LABEL) : null]
    .filter(Boolean)
    .join(" / ");
  const stores = d.stores.map((s) => s.name).join("、");
  return (
    <Link href={`/division/${d.id}`} className={`div-card div-card--${d.confidence}`}>
      <span className="div-card__head">
        <span className="div-card__title">{d.categoryOriginal}</span>
        <ConfidenceBadge value={d.confidence} small />
      </span>
      {place && <span className="div-card__place">{place}</span>}
      <span className="div-card__meta">
        <span className={stores ? "div-card__store" : "div-card__store div-card__store--unknown"}>
          {stores || "店舗未判明"}
        </span>
        <span className="div-card__count">{d.entrantCount > 0 ? `出場者 ${d.entrantCount}名` : "出場者未判明"}</span>
      </span>
    </Link>
  );
}
