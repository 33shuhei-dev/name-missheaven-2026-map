import type { MapStatus } from "@/data/types";
import { MAP_STATUS_DESCRIPTION, MAP_STATUS_LABEL, MAP_STATUS_ORDER } from "@/lib/labels";

/** 地図の凡例。件数はデータから集計した値を受け取る */
export function MapLegend({ counts }: { counts: Record<MapStatus, number> }) {
  return (
    <div className="legend">
      <ul className="legend__list">
        {MAP_STATUS_ORDER.map((s) => (
          <li key={s} className="legend__item">
            <span className={`legend__swatch legend__swatch--${s}`} aria-hidden="true" />
            <span className="legend__text">
              <span className="legend__label">
                {MAP_STATUS_LABEL[s]}
                <span className="legend__count">{counts[s]}</span>
              </span>
              <span className="legend__desc">{MAP_STATUS_DESCRIPTION[s]}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="legend__note">
        色は人気・順位・出場者数ではなく、<strong>情報の調査状態</strong>を表します。
      </p>
    </div>
  );
}
