import Link from "next/link";
import type { SiteModel } from "@/lib/model";
import { regionsWithPrefectures } from "@/lib/model";
import { MAP_STATUS_LABEL } from "@/lib/labels";

/**
 * 地方 → 都道府県 の一覧（地図を使わずに47都道府県へ確実にたどり着くための導線）。
 * 地図と同じ調査状態の色分けを使う。
 */
export function PrefecturePicker({ model }: { model: SiteModel }) {
  return (
    <div className="region-list">
      {regionsWithPrefectures(model).map(({ region, prefectures }) => (
        <section key={region.id} className="region">
          <h3 className="region__name">{region.name}</h3>
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
        </section>
      ))}
    </div>
  );
}
