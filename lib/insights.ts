import { UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import type { Division, PrefectureView, SiteModel } from "./model";

/**
 * 全国比較で初めて分かる情報（珍しい部門・その県だけの部門・情報が少ない県 等）の素材。
 * v1 では画面に出していない（「珍しい部門ランキング」等は将来追加）。
 * しきい値や、どの確認状態を根拠にするかは画面化するときに決める。
 */

export interface CategorySpread {
  /** 部門名（原文） */
  name: string;
  /** この部門名が見つかっている都道府県（スラッグ） */
  prefSlugs: string[];
  divisions: Division[];
  /** 地域未判明の同名部門があるか（「その県だけ」と断定できない） */
  hasUnknownPrefecture: boolean;
}

/** 部門名ごとの全国分布。分布の狭い順に並ぶ */
export function categorySpread(model: SiteModel): CategorySpread[] {
  const map = new Map<string, Division[]>();
  for (const d of model.divisions) map.set(d.categoryOriginal, [...(map.get(d.categoryOriginal) ?? []), d]);
  return [...map.entries()]
    .map(([name, divisions]) => ({
      name,
      prefSlugs: [...new Set(divisions.map((d) => d.prefSlug).filter((s) => s !== UNKNOWN_PREFECTURE_SLUG))],
      divisions,
      hasUnknownPrefecture: divisions.some((d) => d.prefSlug === UNKNOWN_PREFECTURE_SLUG),
    }))
    .sort((a, b) => a.prefSlugs.length - b.prefSlugs.length || a.name.localeCompare(b.name, "ja"));
}

/** その都道府県でしか見つかっていない部門名 */
export function categoriesOnlyIn(model: SiteModel, prefSlug: string): CategorySpread[] {
  return categorySpread(model).filter(
    (c) => c.prefSlugs.length === 1 && c.prefSlugs[0] === prefSlug && !c.hasUnknownPrefecture,
  );
}

/** 情報の少ない順の都道府県（0件を含む） */
export function prefecturesByCoverage(model: SiteModel): PrefectureView[] {
  return [...model.prefectures].sort((a, b) => a.recordCount - b.recordCount || (a.code ?? 0) - (b.code ?? 0));
}
