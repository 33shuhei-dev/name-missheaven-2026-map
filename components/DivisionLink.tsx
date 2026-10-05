import Link from "next/link";
import type { Division } from "@/lib/model";
import { UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { ConfidenceBadge } from "./Badges";

/** 部門への一覧行リンク */
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
    <Link href={`/division/${d.id}`} className="row-link">
      <span className="row-link__main">
        <span className="row-link__title">{d.categoryOriginal}</span>
        <span className="row-link__sub">
          {[place, stores && `店舗：${stores}`, d.entrantCount > 0 ? `出場者 ${d.entrantCount}名` : null]
            .filter(Boolean)
            .join(" ・ ")}
        </span>
      </span>
      <ConfidenceBadge value={d.confidence} small />
    </Link>
  );
}
