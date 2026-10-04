import type { Confidence, DataRecord, Dataset, Entry } from "@/data/types";
import {
  PREFECTURES,
  REGIONS,
  UNKNOWN_PREFECTURE_LABEL,
  UNKNOWN_PREFECTURE_SLUG,
  findPrefectureByName,
} from "@/data/geo";
import { bestConfidence, confidenceRank, UNKNOWN_AREA_LABEL } from "./labels";
import { stableHash } from "./ids";
import { compareJa, normalizeForSearch } from "./text";

/**
 * レコード一覧から、画面表示用の構造（都道府県 → エリア → 部門 → 出場者）を組み立てる。
 * すべてデータから算出するので、部門数・都道府県数などをハードコードしない。
 */

/** 部門 = 都道府県 × エリア × 部門名（categoryOriginal）の組み合わせ */
export interface Division {
  id: string;
  prefSlug: string;
  prefectureName: string;
  area?: string;
  areaId: string;
  categoryOriginal: string;
  /** 検索・比較補助キー（categoryNormalized があればそれ、なければ原文を正規化） */
  compareKey: string;
  records: DataRecord[];
  confidence: Confidence;
  entrantCount: number;
  storeNames: string[];
}

export interface AreaView {
  id: string;
  prefSlug: string;
  /** エリア名。未判明なら undefined */
  name?: string;
  label: string;
  divisions: Division[];
  /** 部門が未判明のレコード（店舗だけ判明 等） */
  uncategorized: DataRecord[];
  recordCount: number;
}

export interface PrefectureView {
  slug: string;
  name: string;
  code: number | null;
  regionId: string | null;
  areas: AreaView[];
  divisionCount: number;
  recordCount: number;
  /** この都道府県の集計値（情報件数・部門数・出場者数・店舗数・確認状態別 等） */
  summary: Summary;
}

export interface CategoryGroup {
  /** 表記揺れの可能性をまとめる比較キー */
  compareKey: string;
  /** このキーに属する部門名（原文）ごとの部門一覧 */
  names: { name: string; divisions: Division[] }[];
}

/**
 * 任意のレコード集合の集計値。全国・都道府県・エリアなど、どの単位にも同じ関数で使う。
 * （将来の全国マップの濃淡・概要パネルも、この値を都道府県ごとに使う想定）
 */
export interface Summary {
  recordCount: number;
  byDataset: Record<Dataset, number>;
  byConfidence: Record<Confidence, number>;
  /** 部門数（都道府県 × エリア × 部門名 の組み合わせ） */
  divisionCount: number;
  /** 部門名（原文）の種類数 */
  categoryNameCount: number;
  /** エリア数（エリア名が判明しているもののみ） */
  areaCount: number;
  entrantCount: number;
  storeCount: number;
  lastCheckedAt: string | null;
}

/** 全国の掲載状況 */
export interface Stats extends Summary {
  prefectureWithDataCount: number;
  prefectureTotal: number;
}

export interface SiteModel {
  records: DataRecord[];
  prefectures: PrefectureView[];
  /** 都道府県未判明（データがある場合のみ） */
  unknownPrefecture: PrefectureView | null;
  divisions: Division[];
  categories: CategoryGroup[];
  stats: Stats;
}

export function toRecords(sets: Record<Dataset, readonly Entry[]>): DataRecord[] {
  return (Object.keys(sets) as Dataset[]).flatMap((dataset) =>
    sets[dataset].map((e) => ({ ...e, dataset })),
  );
}

export function prefSlugOf(r: Pick<Entry, "prefecture">): string {
  return findPrefectureByName(r.prefecture)?.slug ?? UNKNOWN_PREFECTURE_SLUG;
}

export function areaIdOf(prefSlug: string, area: string | undefined): string {
  return area ? `a${stableHash(`${prefSlug}|${area}`)}` : "none";
}

export function divisionIdOf(prefSlug: string, area: string | undefined, category: string): string {
  return `d${stableHash(`${prefSlug}|${area ?? ""}|${category}`)}`;
}

export function compareKeyOf(r: Pick<Entry, "categoryOriginal" | "categoryNormalized">): string {
  return normalizeForSearch(r.categoryNormalized ?? r.categoryOriginal);
}

function sortRecords(list: DataRecord[]): DataRecord[] {
  return [...list].sort(
    (a, b) =>
      confidenceRank(a.confidence) - confidenceRank(b.confidence) ||
      compareJa(a.entrantName ?? "￿", b.entrantName ?? "￿") ||
      a.id.localeCompare(b.id),
  );
}

function prefOrder(slug: string): number {
  return PREFECTURES.find((p) => p.slug === slug)?.code ?? 999;
}

export function summarize(records: readonly DataRecord[]): Summary {
  const count = (f: (r: DataRecord) => string | undefined) =>
    new Set(records.map(f).filter((v) => v !== undefined && v !== "")).size;
  const checked = records
    .map((r) => r.checkedAt)
    .filter((d): d is string => !!d)
    .sort();
  return {
    recordCount: records.length,
    byDataset: {
      verified: records.filter((r) => r.dataset === "verified").length,
      candidate: records.filter((r) => r.dataset === "candidate").length,
    },
    byConfidence: {
      confirmed: records.filter((r) => r.confidence === "confirmed").length,
      probable: records.filter((r) => r.confidence === "probable").length,
      unverified: records.filter((r) => r.confidence === "unverified").length,
    },
    divisionCount: count((r) =>
      r.categoryOriginal ? divisionIdOf(prefSlugOf(r), r.area, r.categoryOriginal) : undefined,
    ),
    categoryNameCount: count((r) => r.categoryOriginal),
    areaCount: count((r) => (r.area ? `${prefSlugOf(r)}|${r.area}` : undefined)),
    // 同名別人の可能性があるため、出場者は「都道府県・店舗・名前」の組で数える
    entrantCount: count((r) =>
      r.entrantName ? `${r.prefecture ?? ""}|${r.storeName ?? ""}|${r.entrantName}` : undefined,
    ),
    storeCount: count((r) => (r.storeName ? `${r.prefecture ?? ""}|${r.storeName}` : undefined)),
    lastCheckedAt: checked.length ? checked[checked.length - 1] : null,
  };
}

export function buildModel(records: DataRecord[]): SiteModel {
  // 1) 部門
  const divMap = new Map<string, DataRecord[]>();
  for (const r of records) {
    if (!r.categoryOriginal) continue;
    const id = divisionIdOf(prefSlugOf(r), r.area, r.categoryOriginal);
    const list = divMap.get(id);
    if (list) list.push(r);
    else divMap.set(id, [r]);
  }

  const divisions: Division[] = [...divMap.entries()].map(([id, list]) => {
    const first = list[0];
    const prefSlug = prefSlugOf(first);
    const entrants = new Set(list.map((r) => r.entrantName).filter(Boolean));
    const stores = new Set(list.map((r) => r.storeName).filter((s): s is string => !!s));
    // 同じ部門内で categoryNormalized が設定されているものがあれば比較キーに使う
    const normalizedSource = list.find((r) => r.categoryNormalized) ?? first;
    return {
      id,
      prefSlug,
      prefectureName: first.prefecture ?? UNKNOWN_PREFECTURE_LABEL,
      area: first.area,
      areaId: areaIdOf(prefSlug, first.area),
      categoryOriginal: first.categoryOriginal!,
      compareKey: compareKeyOf(normalizedSource),
      records: sortRecords(list),
      confidence: bestConfidence(list),
      entrantCount: entrants.size,
      storeNames: [...stores].sort(compareJa),
    };
  });
  divisions.sort(
    (a, b) =>
      prefOrder(a.prefSlug) - prefOrder(b.prefSlug) ||
      compareJa(a.area ?? "￿", b.area ?? "￿") ||
      compareJa(a.categoryOriginal, b.categoryOriginal),
  );

  // 2) 都道府県 → エリア
  const buildPref = (slug: string, name: string, code: number | null, regionId: string | null) => {
    const prefRecords = records.filter((r) => prefSlugOf(r) === slug);
    const areaNames = new Set<string | undefined>(prefRecords.map((r) => r.area));
    const areas: AreaView[] = [...areaNames]
      .map((areaName) => {
        const id = areaIdOf(slug, areaName);
        const inArea = prefRecords.filter((r) => r.area === areaName);
        return {
          id,
          prefSlug: slug,
          name: areaName,
          label: areaName ?? UNKNOWN_AREA_LABEL,
          divisions: divisions.filter((d) => d.prefSlug === slug && d.areaId === id),
          uncategorized: sortRecords(inArea.filter((r) => !r.categoryOriginal)),
          recordCount: inArea.length,
        };
      })
      // エリア名順、エリア未判明は最後
      .sort((a, b) => (a.name ? (b.name ? compareJa(a.name, b.name) : -1) : b.name ? 1 : 0));
    const view: PrefectureView = {
      slug,
      name,
      code,
      regionId,
      areas,
      divisionCount: areas.reduce((n, a) => n + a.divisions.length, 0),
      recordCount: prefRecords.length,
      summary: summarize(prefRecords),
    };
    return view;
  };

  const prefectures = PREFECTURES.map((p) => buildPref(p.slug, p.name, p.code, p.regionId));
  const unknown = buildPref(UNKNOWN_PREFECTURE_SLUG, UNKNOWN_PREFECTURE_LABEL, null, null);

  // 3) 部門名（全国横断）
  const catMap = new Map<string, Map<string, Division[]>>();
  for (const d of divisions) {
    const byName = catMap.get(d.compareKey) ?? new Map<string, Division[]>();
    byName.set(d.categoryOriginal, [...(byName.get(d.categoryOriginal) ?? []), d]);
    catMap.set(d.compareKey, byName);
  }
  const categories: CategoryGroup[] = [...catMap.entries()]
    .map(([compareKey, byName]) => ({
      compareKey,
      names: [...byName.entries()]
        .map(([name, divs]) => ({ name, divisions: divs }))
        .sort((a, b) => compareJa(a.name, b.name)),
    }))
    .sort((a, b) => compareJa(a.names[0].name, b.names[0].name));

  // 4) 掲載状況
  const stats: Stats = {
    ...summarize(records),
    prefectureWithDataCount: prefectures.filter((p) => p.recordCount > 0).length,
    prefectureTotal: PREFECTURES.length,
  };

  return {
    records,
    prefectures,
    unknownPrefecture: unknown.recordCount > 0 ? unknown : null,
    divisions,
    categories,
    stats,
  };
}

export function regionsWithPrefectures(model: SiteModel) {
  return REGIONS.map((region) => {
    const prefs = model.prefectures.filter((p) => p.regionId === region.id);
    return {
      region,
      prefectures: prefs,
      recordCount: prefs.reduce((n, p) => n + p.recordCount, 0),
    };
  });
}

export function findPrefectureView(model: SiteModel, slug: string): PrefectureView | null {
  if (slug === UNKNOWN_PREFECTURE_SLUG) return model.unknownPrefecture;
  return model.prefectures.find((p) => p.slug === slug) ?? null;
}

export function findDivision(model: SiteModel, id: string): Division | null {
  return model.divisions.find((d) => d.id === id) ?? null;
}

/** 同じ部門名（原文が完全一致）の他地域の部門 */
export function sameNameDivisions(model: SiteModel, d: Division): Division[] {
  return model.divisions.filter((x) => x.id !== d.id && x.categoryOriginal === d.categoryOriginal);
}

/** 比較キーは同じだが原文が異なる部門（表記揺れの可能性） */
export function variantDivisions(model: SiteModel, d: Division): Division[] {
  return model.divisions.filter(
    (x) => x.id !== d.id && x.categoryOriginal !== d.categoryOriginal && x.compareKey === d.compareKey,
  );
}
