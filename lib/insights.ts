import { UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import type { Division, PrefectureView, SiteModel } from "./model";

/**
 * 全国比較で初めて分かる情報（珍しい部門・その県だけの部門・情報が少ない県 等）を
 * 算出するための素材。UIはまだ持たない。
 *
 * しきい値（何地域以下を「珍しい」とするか）や、確認状態のどこまでを根拠にするかは
 * 実データが集まってから決めるため、ここでは事実の集計だけを返す。
 */

export interface CategorySpread {
  /** 部門名（原文） */
  name: string;
  /** この部門名が確認されている都道府県（スラッグ、JIS順） */
  prefSlugs: string[];
  divisions: Division[];
  /** 都道府県未判明の同名部門があるか（「その県だけ」と断定できない） */
  hasUnknownPrefecture: boolean;
}

/** 部門名ごとの全国分布。分布の狭い順（珍しい順）に並ぶ */
export function categorySpread(model: SiteModel): CategorySpread[] {
  const map = new Map<string, Division[]>();
  for (const d of model.divisions) {
    map.set(d.categoryOriginal, [...(map.get(d.categoryOriginal) ?? []), d]);
  }
  return [...map.entries()]
    .map(([name, divisions]) => {
      const prefSlugs = [
        ...new Set(divisions.map((d) => d.prefSlug).filter((s) => s !== UNKNOWN_PREFECTURE_SLUG)),
      ];
      return {
        name,
        prefSlugs,
        divisions,
        hasUnknownPrefecture: divisions.some((d) => d.prefSlug === UNKNOWN_PREFECTURE_SLUG),
      };
    })
    .sort((a, b) => a.prefSlugs.length - b.prefSlugs.length || a.name.localeCompare(b.name, "ja"));
}

/** その都道府県でしか確認されていない部門名 */
export function categoriesOnlyIn(model: SiteModel, prefSlug: string): CategorySpread[] {
  return categorySpread(model).filter(
    (c) => c.prefSlugs.length === 1 && c.prefSlugs[0] === prefSlug && !c.hasUnknownPrefecture,
  );
}

/** 情報の少ない順の都道府県（0件を含む）。調査が薄い地域の把握用 */
export function prefecturesByCoverage(model: SiteModel): PrefectureView[] {
  return [...model.prefectures].sort(
    (a, b) => a.recordCount - b.recordCount || (a.code ?? 0) - (b.code ?? 0),
  );
}
