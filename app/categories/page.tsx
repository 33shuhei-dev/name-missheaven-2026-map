import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/data";
import { UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConfidenceBadge } from "@/components/Badges";

export const metadata: Metadata = { title: "部門名一覧" };

export default function CategoriesPage() {
  const { categories, stats } = site;
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "部門名一覧" }]} />
      <h1>部門名一覧</h1>
      <p className="summary-line">
        部門名 {stats.categoryNameCount}種類 ・ 部門 {stats.divisionCount}
      </p>
      <p className="hint">
        確認元の表記のまま掲載しています。似た表記の部門名はまとめて表示していますが、同じ部門であるとは確認していません。
      </p>

      {categories.length === 0 ? (
        <p className="empty">部門名はまだ登録されていません。</p>
      ) : (
        <ul className="category-list">
          {categories.map((g) => (
            <li key={g.compareKey} className="card category">
              {g.names.length > 1 && <p className="category__variant">表記が似ている部門名</p>}
              {g.names.map(({ name, divisions }) => (
                <div key={name} className="category__name-block">
                  <p className="category__name">{name}</p>
                  <ul className="category__places">
                    {divisions.map((d) => (
                      <li key={d.id}>
                        <Link href={`/division/${d.id}`} className="place-link">
                          <span>
                            {d.prefectureName}
                            {d.area ? ` / ${d.area}` : d.prefSlug === "unknown" ? "" : ` / ${UNKNOWN_AREA_LABEL}`}
                          </span>
                          <ConfidenceBadge value={d.confidence} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
