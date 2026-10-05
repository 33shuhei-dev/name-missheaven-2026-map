import Link from "next/link";
import type { Confidence } from "@/data/types";
import {
  CONFIDENCE_DESCRIPTION,
  CONFIDENCE_LABEL,
  CONFIDENCE_ORDER,
  STORE_CONFIDENCE_DESCRIPTION,
  STORE_CONFIDENCE_LABEL,
} from "@/lib/labels";

/** 確認状態の内訳を帯グラフで表示する（件数はデータから集計した値を受け取る） */
export function ConfidenceBar({
  title,
  counts,
  hrefFor,
  subject,
}: {
  title: string;
  counts: Record<Confidence, number>;
  hrefFor: (c: Confidence) => string;
  subject?: "store";
}) {
  const labels = subject === "store" ? STORE_CONFIDENCE_LABEL : CONFIDENCE_LABEL;
  const descriptions = subject === "store" ? STORE_CONFIDENCE_DESCRIPTION : CONFIDENCE_DESCRIPTION;
  const total = CONFIDENCE_ORDER.reduce((n, c) => n + counts[c], 0) || 1;
  return (
    <div className="conf-bar" aria-label={`${title}の内訳`}>
      <p className="conf-bar__title">{title}</p>
      <div className="conf-bar__track" aria-hidden="true">
        {CONFIDENCE_ORDER.map((c) => (
          <span key={c} className={`conf-bar__seg conf-bar__seg--${c}`} style={{ width: `${(counts[c] / total) * 100}%` }} />
        ))}
      </div>
      <ul className="conf-bar__legend">
        {CONFIDENCE_ORDER.map((c) => (
          <li key={c}>
            <Link href={hrefFor(c)} title={descriptions[c]}>
              <span className={`conf-bar__dot conf-bar__dot--${c}`} aria-hidden="true" />
              {labels[c]}
              <strong>{counts[c]}</strong>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
