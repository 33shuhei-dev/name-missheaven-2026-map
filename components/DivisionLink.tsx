import Link from "next/link";
import type { Division } from "@/lib/model";
import { UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { ConfidenceBadge } from "./Badges";

/** 部門への一覧行リンク */
export function DivisionLink({ division: d, showPlace = false }: { division: Division; showPlace?: boolean }) {
  return (
    <Link href={`/division/${d.id}`} className="row-link">
      <span className="row-link__main">
        <span className="row-link__title">{d.categoryOriginal}</span>
        <span className="row-link__sub">
          {showPlace && `${d.prefectureName} / ${d.area ?? UNKNOWN_AREA_LABEL} ・ `}
          出場者 {d.entrantCount > 0 ? `${d.entrantCount}名` : "未判明"}
          {d.storeNames.length > 0 && ` ・ 店舗 ${d.storeNames.length}`}
        </span>
      </span>
      <ConfidenceBadge value={d.confidence} />
    </Link>
  );
}
