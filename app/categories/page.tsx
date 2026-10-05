import type { Metadata } from "next";
import { site } from "@/lib/data";
import { bestConfidence, UNKNOWN_AREA_LABEL } from "@/lib/labels";
import { normalizeForSearch } from "@/lib/text";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryExplorer, type CategoryRow } from "@/components/CategoryExplorer";

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
        confidence: bestConfidence([...records, ...divisions.map((d) => ({ confidence: d.confidence }))]),
        divisions: divisions.map((d) => ({
          id: d.id,
          label: `${d.prefectureName} / ${d.listingArea ?? UNKNOWN_AREA_LABEL}`,
          confidence: d.confidence,
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
      <p className="summary-line">
        部門名（原文） {stats.allCategoryNameCount}種類 ・ 店舗と結び付いた部門名 {stats.stores.storeCategoryCount}種類
      </p>
      <p className="hint">
        部門名は情報源の掲載原文のまま表示しています。記号・絵文字・語順が違う名前は統合していません（検索では表記の違いを吸収します）。
      </p>
      <CategoryExplorer rows={rows} prefOptions={prefOptions} />
    </>
  );
}
