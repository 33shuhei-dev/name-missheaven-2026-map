import type { Confidence, MapStatus } from "@/data/types";
import { CONFIDENCE_DESCRIPTION, CONFIDENCE_LABEL, MAP_STATUS_DESCRIPTION, MAP_STATUS_LABEL } from "@/lib/labels";

export function ConfidenceBadge({ value, small = false }: { value: Confidence; small?: boolean }) {
  return (
    <span className={`badge badge--${value}${small ? " badge--small" : ""}`} title={CONFIDENCE_DESCRIPTION[value]}>
      {CONFIDENCE_LABEL[value]}
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
