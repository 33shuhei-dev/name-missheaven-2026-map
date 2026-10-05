import Link from "next/link";
import type { MapStatus } from "@/data/types";
import type { SiteModel } from "@/lib/model";
import { regionsWithPrefectures } from "@/lib/model";
import { MAP_STATUS_LABEL, MAP_STATUS_ORDER } from "@/lib/labels";

/**
 * 地方 → 都道府県 の一覧（地図の補助。地図を使わずに47都道府県へたどり着ける）。
 * 地方ごとに <details> で折りたたむ（JavaScript なしでも開閉できる）。
 */
export function PrefecturePicker({ model }: { model: SiteModel }) {
  return (
    <div className="region-list">
      {regionsWithPrefectures(model).map(({ region, prefectures }) => {
        const counts = Object.fromEntries(
          MAP_STATUS_ORDER.map((s) => [s, prefectures.filter((p) => p.status === s).length]),
        ) as Record<MapStatus, number>;
        return (
          <details key={region.id} className="region">
            <summary className="region__summary">
              <span className="region__name">{region.name}</span>
              <span className="region__counts" aria-label={MAP_STATUS_ORDER.map((s) => `${MAP_STATUS_LABEL[s]} ${counts[s]}`).join("、")}>
                {MAP_STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
                  <span key={s} className="region__count">
                    <span className={`legend__swatch legend__swatch--${s}`} aria-hidden="true" />
                    {counts[s]}
                  </span>
                ))}
              </span>
            </summary>
            <ul className="pref-grid">
              {prefectures.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/pref/${p.slug}`}
                    className={`pref-chip pref-chip--${p.status}`}
                    aria-label={`${p.name}：${MAP_STATUS_LABEL[p.status]}（情報${p.recordCount}件）`}
                  >
                    <span className={`legend__swatch legend__swatch--${p.status}`} aria-hidden="true" />
                    <span className="pref-chip__name">{p.name}</span>
                    <span className="pref-chip__count">{p.recordCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
