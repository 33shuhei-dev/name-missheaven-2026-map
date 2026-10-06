import { UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import type { SiteModel } from "./model";

/** 部門名（原文）ごとの探索用の要約。数字はデータからの集計で、別の意味の数字を合算しない */
export interface CategorySummary {
  name: string;
  /** この部門名に関係する店舗の数（店舗IDの重複なし） */
  storeCount: number;
  /** この部門名の情報が見つかった都道府県の数（地域未判明は数えない） */
  prefectureCount: number;
  /** 部門が1か所だけならその部門ページ、複数なら部門一覧でその部門名を開く */
  href: string;
}

/** 「レア」：このサイトで見つかった店舗がこの数以下（1店以上）の部門。公式に珍しいという意味ではない */
export const RARE_MAX_STORES = 2;

export function categoryHref(name: string): string {
  return `/categories?q=${encodeURIComponent(name)}`;
}

export function summarizeCategories(site: SiteModel): CategorySummary[] {
  return site.categories.flatMap((g) =>
    g.names.map(({ name, divisions }) => ({
      name,
      storeCount: new Set(divisions.flatMap((d) => d.stores.map((s) => s.id))).size,
      prefectureCount: new Set(divisions.map((d) => d.prefSlug).filter((s) => s !== UNKNOWN_PREFECTURE_SLUG)).size,
      href: divisions.length === 1 ? `/division/${divisions[0].id}` : categoryHref(name),
    })),
  );
}

/**
 * トップの「こんな部門まである」に出す部門名の候補（掲載原文どおり）。
 * データに存在するものだけを表示し、足りない分はデータから（都道府県数・店舗数の多い順に）補う。
 */
const FEATURED_CANDIDATES = [
  "ギャンブル大好き部門",
  "前立腺達人部門",
  "おっぱい自慢部門",
  "くじら(潮吹き)部門",
  "大食い部門",
  "お尻好きならココ部門",
  "うちは地元が好きじゃけぇ♪部門",
  "性格がドS部門",
  "レア出勤部門",
  "顔出しNG部門",
  "店長一押し部門",
  "隠れ美女部門",
];

export function featuredCategories(all: readonly CategorySummary[], count = 10): CategorySummary[] {
  const byName = new Map(all.map((c) => [c.name, c]));
  const picked = FEATURED_CANDIDATES.map((n) => byName.get(n)).filter((c): c is CategorySummary => !!c && c.storeCount > 0);
  const rest = all
    .filter((c) => c.storeCount > 0 && !picked.includes(c))
    .sort((a, b) => b.prefectureCount - a.prefectureCount || b.storeCount - a.storeCount || a.name.localeCompare(b.name, "ja"));
  return [...picked, ...rest].slice(0, count);
}
