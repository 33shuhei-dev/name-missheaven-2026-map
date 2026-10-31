import { findPrefectureBySlug } from "@/data/geo";

/** ヘブンの在籍ページ・店舗ページのURLから、都道府県名を読み取る（URLの文字列だけを使う。サイトへはアクセスしない） */
export function prefectureFromHeavenUrl(text: string): string | null {
  const m = text.match(/cityheaven\.net\/([a-z]+)\/A\d+\/A\d+\/[^/\s]+/i);
  return m ? (findPrefectureBySlug(m[1].toLowerCase())?.name ?? null) : null;
}
