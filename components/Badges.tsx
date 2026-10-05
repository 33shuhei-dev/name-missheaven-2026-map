import type { Confidence, MapStatus } from "@/data/types";
import {
  CONFIDENCE_DESCRIPTION,
  CONFIDENCE_LABEL,
  MAP_STATUS_DESCRIPTION,
  MAP_STATUS_LABEL,
  STORE_CONFIDENCE_DESCRIPTION,
  STORE_CONFIDENCE_LABEL,
} from "@/lib/labels";

/** subject="store" は店舗の参加情報としての表示名（参加確認済み・参加情報あり・参加情報を1件確認） */
export function ConfidenceBadge({
  value,
  small = false,
  subject,
}: {
  value: Confidence;
  small?: boolean;
  subject?: "store";
}) {
  const store = subject === "store";
  return (
    <span
      className={`badge badge--${value}${store ? " badge--store" : ""}${small ? " badge--small" : ""}`}
      title={(store ? STORE_CONFIDENCE_DESCRIPTION : CONFIDENCE_DESCRIPTION)[value]}
    >
      {(store ? STORE_CONFIDENCE_LABEL : CONFIDENCE_LABEL)[value]}
    </span>
  );
}

export function StatusBadge({ value }: { value: MapStatus }) {
  return (
    <span className={`status status--${value}`} title={MAP_STATUS_DESCRIPTION[value]}>
      <span className={`legend__swatch legend__swatch--${value}`} aria-hidden="true" />
      {MAP_STATUS_LABEL[value]}
    </span>
  );
}
