import type { Metadata } from "next";
import { Suspense } from "react";
import { site } from "@/lib/data";
import { buildPlaceIndex } from "@/lib/search";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SearchClient } from "@/components/SearchClient";

export const metadata: Metadata = { title: "全国横断検索" };

export default function SearchPage() {
  const places = buildPlaceIndex(site);
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "全国横断検索" }]} />
      <h1>全国横断検索</h1>
      <Suspense fallback={<p className="hint">読み込み中…</p>}>
        <SearchClient records={site.records} places={places} />
      </Suspense>
    </>
  );
}
