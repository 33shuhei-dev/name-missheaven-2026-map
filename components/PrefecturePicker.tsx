import Link from "next/link";
import type { SiteModel } from "@/lib/model";
import { regionsWithPrefectures } from "@/lib/model";

/**
 * 地方 → 都道府県 の選択UI。
 * 将来SVG日本地図に置き換える場合は、同じ regionsWithPrefectures() の結果
 * （都道府県スラッグ・件数）を地図コンポーネントへ渡せばよい。
 */
export function PrefecturePicker({ model }: { model: SiteModel }) {
  const regions = regionsWithPrefectures(model);
  return (
    <div className="region-list">
      {regions.map(({ region, prefectures, recordCount }) => (
        <details key={region.id} className="region" open={recordCount > 0}>
          <summary>
            <span className="region__name">{region.name}</span>
            <span className="region__count">{recordCount > 0 ? `${recordCount}件` : "情報なし"}</span>
          </summary>
          <ul className="pref-grid">
            {prefectures.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/pref/${p.slug}`}
                  className={`pref-chip${p.recordCount === 0 ? " pref-chip--empty" : ""}`}
                >
                  <span>{p.name}</span>
                  <span className="pref-chip__count">{p.recordCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
