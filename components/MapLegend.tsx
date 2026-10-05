import type { MapStatus } from "@/data/types";
import { MAP_STATUS_DESCRIPTION, MAP_STATUS_LABEL, MAP_STATUS_ORDER } from "@/lib/labels";

/**
 * 地図の凡例（日本語の状態名を主表示にする）。件数はデータから集計した値を受け取る。
 */
export function MapLegend({ counts }: { counts: Record<MapStatus, number> }) {
  const total = MAP_STATUS_ORDER.reduce((n, s) => n + counts[s], 0) || 1;
  return (
    <div className="legend">
      <ul className="legend__list">
        {MAP_STATUS_ORDER.map((s) => (
          <li key={s} className="legend__item">
            <span className={`legend__swatch legend__swatch--${s}`} aria-hidden="true" />
            <span className="legend__label">{MAP_STATUS_LABEL[s]}</span>
            <span className="legend__count">{counts[s]}</span>
          </li>
        ))}
      </ul>
      <div className="legend__bar" aria-hidden="true">
        {MAP_STATUS_ORDER.map((s) => (
          <span key={s} className={`legend__bar-seg legend__swatch--${s}`} style={{ width: `${(counts[s] / total) * 100}%` }} />
        ))}
      </div>
      <p className="legend__note">
        色は人気・順位・出場者数ではなく<strong>情報の調査状態</strong>です。「現在確認できた情報なし」は、部門や出場者がいないという意味ではありません。
      </p>
      <details className="legend__more">
        <summary>凡例の説明</summary>
        <dl>
          {MAP_STATUS_ORDER.map((s) => (
            <div key={s}>
              <dt>{MAP_STATUS_LABEL[s]}</dt>
              <dd>{MAP_STATUS_DESCRIPTION[s]}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
