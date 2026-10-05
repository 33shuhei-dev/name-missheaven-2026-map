import type { Metadata } from "next";
import { site } from "@/lib/data";
import { Suspense } from "react";
import { UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import { UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { normalizeForSearch } from "@/lib/text";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryExplorer, CategoryExplorerWithParams, type CategoryRow } from "@/components/CategoryExplorer";

export const metadata: Metadata = { title: "部門一覧" };

export default function CategoriesPage() {
  const { stats } = site;
  const rows: CategoryRow[] = site.categories.flatMap((g) =>
    g.names.map(({ name, divisions }) => {
      const records = divisions.flatMap((d) => d.records);
      return {
        name,
        variants: g.names.filter((n) => n.name !== name).map((n) => n.name),
        keys: [...new Set([normalizeForSearch(name), ...records.map((r) => normalizeForSearch(r.categoryNormalized))])].filter(Boolean),
        recordCount: records.length,
        storeCount: new Set(divisions.flatMap((d) => d.stores.map((st) => st.id))).size,
        prefectures: [...new Map(divisions.map((d) => [d.prefSlug, d.prefectureName])).entries()].map(([slug, label]) => ({ slug, label })),
        prefectureCount: new Set(divisions.map((d) => d.prefSlug).filter((x) => x !== UNKNOWN_PREFECTURE_SLUG)).size,
        divisions: divisions.map((d) => ({
          id: d.id,
          label: `${d.prefectureName} / ${d.listingArea ?? UNKNOWN_AREA_LABEL}`,
          storeCount: d.stores.length,
        })),
      };
    }),
  );
  const prefOptions = [...new Map(rows.flatMap((r) => r.prefectures).map((p) => [p.slug, p.label])).entries()].map(
    ([slug, label]) => ({ slug, label }),
  );
  const order = new Map(site.prefectures.map((p) => [p.slug, p.code ?? 99]));
  prefOptions.sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));

  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "部門一覧" }]} />
      <h1>部門一覧</h1>
      <p className="lead">
        ミスヘブン総選挙2026で見つかった部門は<strong>{stats.allCategoryNameCount}種類</strong>。気になる部門をタップすると、その部門がある地域と店舗を見られます。
      </p>
      <p className="hint hint--tight">部門名は掲載された表記のままです（記号や言い回しの違う似た名前は、別の部門として並べています）。</p>
      <Suspense fallback={<CategoryExplorer rows={rows} prefOptions={prefOptions} />}>
        <CategoryExplorerWithParams rows={rows} prefOptions={prefOptions} />
      </Suspense>
    </>
  );
}
