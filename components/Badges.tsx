import type { Confidence, Dataset } from "@/data/types";
import { CONFIDENCE_DESCRIPTION, CONFIDENCE_LABEL, DATASET_LABEL } from "@/lib/labels";

export function ConfidenceBadge({ value }: { value: Confidence }) {
  return (
    <span className={`badge badge--${value}`} title={CONFIDENCE_DESCRIPTION[value]}>
      {CONFIDENCE_LABEL[value]}
    </span>
  );
}

export function DatasetBadge({ value }: { value: Dataset }) {
  return <span className={`badge badge--ds-${value}`}>{DATASET_LABEL[value]}</span>;
}
