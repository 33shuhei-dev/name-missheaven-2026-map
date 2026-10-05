import type { Metadata } from "next";
import { Suspense } from "react";
import { site } from "@/lib/data";
import { buildSearchIndex } from "@/lib/search";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SearchClient, type PlaceOption } from "@/components/SearchClient";

export const metadata: Metadata = { title: "全国横断検索" };

export default function SearchPage() {
  const items = buildSearchIndex(site);
  const prefs = site.unknownPrefecture ? [...site.prefectures, site.unknownPrefecture] : site.prefectures;
  const places: PlaceOption[] = prefs.map((p) => ({
    slug: p.slug,
    name: p.name,
    recordCount: p.recordCount,
    areas: p.areas.map((a) => ({ id: a.id, label: a.label, name: a.name })),
  }));
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "全国横断検索" }]} />
      <h1>全国横断検索</h1>
      <Suspense fallback={<p className="hint">読み込み中…</p>}>
        <SearchClient items={items} places={places} />
      </Suspense>
    </>
  );
}
