import type { Confidence, Dataset, MapStatus, Phase1MapPrefecture, SiteRecord } from "@/data/types";
import {
  PREFECTURES,
  REGIONS,
  UNKNOWN_PREFECTURE_LABEL,
  UNKNOWN_PREFECTURE_SLUG,
  findPrefectureByName,
} from "@/data/geo";
import { bestConfidence, confidenceRank, UNKNOWN_AREA_LABEL } from "./labels";
import { stableHash } from "./ids";
import { dateOnly } from "./phase1";
import { compareJa, normalizeForSearch } from "./text";

/**
 * レコード一覧から、画面表示用の構造（都道府県 → 掲載地域 → 部門 → 店舗 → 出場者）を組み立てる。
 * すべてデータから算出し、件数や状態をハードコードしない。データにない階層は作らない。
 */

/* ───────────── 集計 ───────────── */

/**
 * 任意のレコード集合の集計値。全国・都道府県・掲載地域のどの単位にも同じ関数を使う。
 * 定義は Phase 1 の map_47prefectures_v1.json に合わせている（lib/validate.ts で照合）。
 */
export interface Summary {
  /** 観測レコード数 */
  recordCount: number;
  byDataset: Record<Dataset, number>;
  byConfidence: Record<Confidence, number>;
  /** 部門名（categoryOriginal 原文）の種類数。地図データの divisionCount と同じ定義 */
  categoryNameCount: number;
  /** 部門ページ数（都道府県 × 掲載地域 × 部門名 の組み合わせ） */
  divisionCount: number;
  /** 掲載地域の種類数（都道府県 × listingArea） */
  listingAreaCount: number;
  /** 掲載地域が未判明のレコード数 */
  unknownListingAreaRecordCount: number;
  /** 店舗名（原文）の種類数（都道府県 × 店舗名） */
  storeCount: number;
  /** 出場者数（都道府県 × 店舗名 × 人物名。同姓同名の別人は統合しない／実人数の重複排除ではない） */
  entrantCount: number;
  /** 最終確認日（YYYY-MM-DD） */
  lastCheckedAt: string | null;
}

export function summarize(records: readonly SiteRecord[]): Summary {
  const distinct = (keys: (string | undefined)[]) => new Set(keys.filter((k): k is string => !!k)).size;
  const checked = records
    .map((r) => dateOnly(r.checkedAt))
    .filter((d): d is string => !!d)
    .sort();
  return {
    recordCount: records.length,
    byDataset: {
      phase1: records.filter((r) => r.dataset === "phase1").length,
      update: records.filter((r) => r.dataset === "update").length,
    },
    byConfidence: {
      confirmed: records.filter((r) => r.confidence === "confirmed").length,
      probable: records.filter((r) => r.confidence === "probable").length,
      unverified: records.filter((r) => r.confidence === "unverified").length,
    },
    categoryNameCount: distinct(records.map((r) => r.categoryOriginal)),
    divisionCount: distinct(records.map((r) => divisionIdOf(prefSlugOf(r), r.listingArea, r.categoryOriginal))),
    listingAreaCount: distinct(records.map((r) => (r.listingArea ? `${r.prefecture ?? ""}|${r.listingArea}` : undefined))),
    unknownListingAreaRecordCount: records.filter((r) => !r.listingArea).length,
    storeCount: distinct(records.map((r) => (r.storeName ? `${r.prefecture ?? ""}|${r.storeName}` : undefined))),
    entrantCount: distinct(
      records.flatMap((r) => r.entrantNames.map((n) => `${r.prefecture ?? ""}|${r.storeName ?? ""}|${n}`)),
    ),
    lastCheckedAt: checked.length ? checked[checked.length - 1] : null,
  };
}

/** 都道府県単位の集計（地図データとの照合にも使う） */
export function derivePrefectureCounts(records: readonly SiteRecord[]) {
  return {
    ...summarize(records),
    listingAreas: [...new Set(records.map((r) => r.listingArea).filter((a): a is string => !!a))],
  };
}

/**
 * 地図の状態。Phase 1 の定義どおり:
 * confirmed = confirmed 観測あり / candidate = probable・unverified のみ / searched_no_evidence = 観測なし
 * （searched_no_evidence は「調査済みだが現在情報未発見」であり、不存在を意味しない）
 */
export function deriveStatus(records: readonly SiteRecord[]): MapStatus {
  if (records.some((r) => r.confidence === "confirmed")) return "confirmed";
  if (records.length > 0) return "candidate";
  return "searched_no_evidence";
}

/** nationwide_dataset_v1.json の summary と同じ定義の全国集計（照合可能なもの） */
export function phase1SummaryOf(records: readonly SiteRecord[]) {
  const prefs = PREFECTURES.map((p) => records.filter((r) => r.prefecture === p.name));
  const s = summarize(records);
  return {
    recordCount: s.recordCount,
    uniqueCategoryOriginalCount: s.categoryNameCount,
    prefectureUnknown: records.filter((r) => !r.prefecture).length,
    listingAreaUnknown: s.unknownListingAreaRecordCount,
    confirmedCount: s.byConfidence.confirmed,
    probableCount: s.byConfidence.probable,
    unverifiedCount: s.byConfidence.unverified,
    prefecturesWithDivisionCandidates: prefs.filter((rs) => rs.length > 0).length,
    prefecturesWithConfirmed: prefs.filter((rs) => deriveStatus(rs) === "confirmed").length,
    searchedNoEvidencePrefectures: prefs.filter((rs) => deriveStatus(rs) === "searched_no_evidence").length,
    formalElectionConnections: records.filter((r) => r.formalElectionArea).length,
  };
}

/* ───────────── ID ───────────── */

export function prefSlugOf(r: Pick<SiteRecord, "prefecture">): string {
  return findPrefectureByName(r.prefecture)?.slug ?? UNKNOWN_PREFECTURE_SLUG;
}

export function areaIdOf(prefSlug: string, listingArea: string | undefined): string {
  return listingArea ? `a${stableHash(`${prefSlug}|${listingArea}`)}` : "none";
}

export function divisionIdOf(prefSlug: string, listingArea: string | undefined, category: string): string {
  return `d${stableHash(`${prefSlug}|${listingArea ?? ""}|${category}`)}`;
}

export function storeIdOf(prefSlug: string, storeName: string): string {
  return `s${stableHash(`${prefSlug}|${storeName}`)}`;
}

export function compareKeyOf(r: Pick<SiteRecord, "categoryOriginal" | "categoryNormalized">): string {
  return normalizeForSearch(r.categoryNormalized ?? r.categoryOriginal);
}

/* ───────────── 画面用の構造 ───────────── */

/** 部門 = 都道府県 × 掲載地域 × 部門名（原文） */
export interface Division {
  id: string;
  prefSlug: string;
  prefectureName: string;
  listingArea?: string;
  areaId: string;
  categoryOriginal: string;
  /** 検索・比較補助キー */
  compareKey: string;
  records: SiteRecord[];
  confidence: Confidence;
  entrantCount: number;
  stores: { id: string; name: string }[];
}

export interface StoreView {
  id: string;
  name: string;
  prefSlug: string;
  prefectureName: string;
  listingAreas: string[];
  records: SiteRecord[];
  divisions: Division[];
  entrantNames: string[];
  confidence: Confidence;
}

/** 出場者 = 都道府県 × 店舗名 × 人物名（同姓同名の別人を自動統合しない） */
export interface EntrantView {
  id: string;
  name: string;
  prefSlug: string;
  prefectureName: string;
  storeName?: string;
  storeId?: string;
  listingAreas: string[];
  records: SiteRecord[];
  divisions: Division[];
  confidence: Confidence;
}

export interface AreaView {
  id: string;
  prefSlug: string;
  /** 掲載地域名。未判明なら undefined */
  name?: string;
  label: string;
  divisions: Division[];
  stores: StoreView[];
  recordCount: number;
  summary: Summary;
}

export interface PrefectureView {
  slug: string;
  name: string;
  /** JIS コード（地域未判明は null） */
  code: number | null;
  regionId: string | null;
  status: MapStatus;
  areas: AreaView[];
  divisions: Division[];
  stores: StoreView[];
  entrants: EntrantView[];
  recordCount: number;
  summary: Summary;
  /** Phase 1 地図データの補足（あれば） */
  mapInfo?: Pick<Phase1MapPrefecture, "lastReviewed" | "unresolved">;
}

export interface CategoryGroup {
  compareKey: string;
  names: { name: string; divisions: Division[] }[];
}

export interface Stats extends Summary {
  prefectureTotal: number;
  statusCounts: Record<MapStatus, number>;
  /** 部門情報のある都道府県数（confirmed + candidate） */
  prefecturesWithData: number;
  /** 都道府県未判明のレコード数 */
  unknownPrefectureRecordCount: number;
}

export interface SiteModel {
  records: SiteRecord[];
  /** 47都道府県（データ0件の県も含む） */
  prefectures: PrefectureView[];
  /** 地域未判明（都道府県が未判明）の情報。0件なら null */
  unknownPrefecture: PrefectureView | null;
  divisions: Division[];
  stores: StoreView[];
  entrants: EntrantView[];
  categories: CategoryGroup[];
  stats: Stats;
}

function sortRecords(list: SiteRecord[]): SiteRecord[] {
  return [...list].sort(
    (a, b) =>
      confidenceRank(a.confidence) - confidenceRank(b.confidence) ||
      compareJa(a.storeName ?? "￿", b.storeName ?? "￿") ||
      compareJa(a.entrantNames[0] ?? "￿", b.entrantNames[0] ?? "￿") ||
      a.id.localeCompare(b.id),
  );
}

function prefOrder(slug: string): number {
  return PREFECTURES.find((p) => p.slug === slug)?.code ?? 999;
}

function groupBy<T>(items: readonly T[], key: (t: T) => string | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    if (k === undefined) continue;
    const list = map.get(k);
    if (list) list.push(it);
    else map.set(k, [it]);
  }
  return map;
}

const uniq = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))];

export function buildModel(
  records: SiteRecord[],
  mapInfo: readonly Phase1MapPrefecture[] = [],
): SiteModel {
  // 1) 部門
  const divisions: Division[] = [
    ...groupBy(records, (r) => divisionIdOf(prefSlugOf(r), r.listingArea, r.categoryOriginal)).entries(),
  ].map(([id, list]) => {
    const first = list[0];
    const prefSlug = prefSlugOf(first);
    const normalizedSource = list.find((r) => r.categoryNormalized) ?? first;
    return {
      id,
      prefSlug,
      prefectureName: first.prefecture ?? UNKNOWN_PREFECTURE_LABEL,
      listingArea: first.listingArea,
      areaId: areaIdOf(prefSlug, first.listingArea),
      categoryOriginal: first.categoryOriginal,
      compareKey: compareKeyOf(normalizedSource),
      records: sortRecords(list),
      confidence: bestConfidence(list),
      entrantCount: new Set(list.flatMap((r) => r.entrantNames.map((n) => `${r.storeName ?? ""}|${n}`))).size,
      stores: uniq(list.map((r) => r.storeName))
        .sort(compareJa)
        .map((name) => ({ id: storeIdOf(prefSlug, name), name })),
    };
  });
  divisions.sort(
    (a, b) =>
      prefOrder(a.prefSlug) - prefOrder(b.prefSlug) ||
      compareJa(a.listingArea ?? "￿", b.listingArea ?? "￿") ||
      compareJa(a.categoryOriginal, b.categoryOriginal),
  );
  const divisionOf = (r: SiteRecord) =>
    divisions.find((d) => d.id === divisionIdOf(prefSlugOf(r), r.listingArea, r.categoryOriginal))!;

  // 2) 店舗
  const stores: StoreView[] = [
    ...groupBy(records, (r) => (r.storeName ? storeIdOf(prefSlugOf(r), r.storeName) : undefined)).entries(),
  ]
    .map(([id, list]) => ({
      id,
      name: list[0].storeName!,
      prefSlug: prefSlugOf(list[0]),
      prefectureName: list[0].prefecture ?? UNKNOWN_PREFECTURE_LABEL,
      listingAreas: uniq(list.map((r) => r.listingArea)).sort(compareJa),
      records: sortRecords(list),
      divisions: [...new Set(list.map(divisionOf))],
      entrantNames: uniq(list.flatMap((r) => r.entrantNames)),
      confidence: bestConfidence(list),
    }))
    .sort((a, b) => prefOrder(a.prefSlug) - prefOrder(b.prefSlug) || compareJa(a.name, b.name));

  // 3) 出場者
  const entrantRows = records.flatMap((r) => r.entrantNames.map((name) => ({ r, name })));
  const entrants: EntrantView[] = [
    ...groupBy(entrantRows, ({ r, name }) => `${prefSlugOf(r)}|${r.storeName ?? ""}|${name}`).entries(),
  ]
    .map(([key, rows]) => {
      const r0 = rows[0].r;
      const prefSlug = prefSlugOf(r0);
      const list = rows.map((x) => x.r);
      return {
        id: `e${stableHash(key)}`,
        name: rows[0].name,
        prefSlug,
        prefectureName: r0.prefecture ?? UNKNOWN_PREFECTURE_LABEL,
        storeName: r0.storeName,
        storeId: r0.storeName ? storeIdOf(prefSlug, r0.storeName) : undefined,
        listingAreas: uniq(list.map((r) => r.listingArea)).sort(compareJa),
        records: sortRecords(list),
        divisions: [...new Set(list.map(divisionOf))],
        confidence: bestConfidence(list),
      };
    })
    .sort(
      (a, b) =>
        prefOrder(a.prefSlug) - prefOrder(b.prefSlug) ||
        compareJa(a.storeName ?? "￿", b.storeName ?? "￿") ||
        compareJa(a.name, b.name),
    );

  // 4) 都道府県 → 掲載地域
  const buildPref = (
    slug: string,
    name: string,
    code: number | null,
    regionId: string | null,
  ): PrefectureView => {
    const prefRecords = records.filter((r) => prefSlugOf(r) === slug);
    const prefStores = stores.filter((s) => s.prefSlug === slug);
    const areas: AreaView[] = [...new Set(prefRecords.map((r) => r.listingArea))]
      .map((areaName) => {
        const id = areaIdOf(slug, areaName);
        const inArea = prefRecords.filter((r) => r.listingArea === areaName);
        return {
          id,
          prefSlug: slug,
          name: areaName,
          label: areaName ?? UNKNOWN_AREA_LABEL,
          divisions: divisions.filter((d) => d.prefSlug === slug && d.areaId === id),
          stores: prefStores.filter((s) => s.records.some((r) => r.listingArea === areaName)),
          recordCount: inArea.length,
          summary: summarize(inArea),
        };
      })
      // 掲載地域名順、未判明は最後
      .sort((a, b) => (a.name ? (b.name ? compareJa(a.name, b.name) : -1) : b.name ? 1 : 0));
    const info = mapInfo.find((m) => m.prefecture === name);
    return {
      slug,
      name,
      code,
      regionId,
      status: deriveStatus(prefRecords),
      areas,
      divisions: divisions.filter((d) => d.prefSlug === slug),
      stores: prefStores,
      entrants: entrants.filter((e) => e.prefSlug === slug),
      recordCount: prefRecords.length,
      summary: summarize(prefRecords),
      ...(info ? { mapInfo: { lastReviewed: info.lastReviewed, unresolved: info.unresolved } } : {}),
    };
  };

  const prefectures = PREFECTURES.map((p) => buildPref(p.slug, p.name, p.code, p.regionId));
  const unknown = buildPref(UNKNOWN_PREFECTURE_SLUG, UNKNOWN_PREFECTURE_LABEL, null, null);

  // 5) 部門名（全国横断・表記揺れ候補のまとまり）
  const categories: CategoryGroup[] = [...groupBy(divisions, (d) => d.compareKey).entries()]
    .map(([compareKey, divs]) => ({
      compareKey,
      names: [...groupBy(divs, (d) => d.categoryOriginal).entries()]
        .map(([name, ds]) => ({ name, divisions: ds }))
        .sort((a, b) => compareJa(a.name, b.name)),
    }))
    .sort((a, b) => compareJa(a.names[0].name, b.names[0].name));

  // 6) 全国の掲載状況
  const statusCounts: Record<MapStatus, number> = { confirmed: 0, candidate: 0, searched_no_evidence: 0 };
  for (const p of prefectures) statusCounts[p.status]++;
  const stats: Stats = {
    ...summarize(records),
    prefectureTotal: prefectures.length,
    statusCounts,
    prefecturesWithData: prefectures.filter((p) => p.recordCount > 0).length,
    unknownPrefectureRecordCount: unknown.recordCount,
  };

  return {
    records,
    prefectures,
    unknownPrefecture: unknown.recordCount > 0 ? unknown : null,
    divisions,
    stores,
    entrants,
    categories,
    stats,
  };
}

export function regionsWithPrefectures(model: SiteModel) {
  return REGIONS.map((region) => {
    const prefs = model.prefectures.filter((p) => p.regionId === region.id);
    return { region, prefectures: prefs, recordCount: prefs.reduce((n, p) => n + p.recordCount, 0) };
  });
}

export function findPrefectureView(model: SiteModel, slug: string): PrefectureView | null {
  if (slug === UNKNOWN_PREFECTURE_SLUG) return model.unknownPrefecture;
  return model.prefectures.find((p) => p.slug === slug) ?? null;
}

export function findDivision(model: SiteModel, id: string): Division | null {
  return model.divisions.find((d) => d.id === id) ?? null;
}

export function findStore(model: SiteModel, id: string): StoreView | null {
  return model.stores.find((s) => s.id === id) ?? null;
}

/** 同じ部門名（原文が完全一致）の他地域の部門 */
export function sameNameDivisions(model: SiteModel, d: Division): Division[] {
  return model.divisions.filter((x) => x.id !== d.id && x.categoryOriginal === d.categoryOriginal);
}

/** 比較キーは同じだが原文が異なる部門（表記揺れの可能性。同一とは確認していない） */
export function variantDivisions(model: SiteModel, d: Division): Division[] {
  return model.divisions.filter(
    (x) => x.id !== d.id && x.categoryOriginal !== d.categoryOriginal && x.compareKey === d.compareKey,
  );
}

/** 出場者の遷移先: 店舗がわかれば店舗ページ、なければ最初の部門の該当レコード */
export function entrantHref(e: EntrantView): string {
  if (e.storeId) return `/store/${e.storeId}#${e.id}`;
  const r = e.records[0];
  return `/division/${divisionIdOf(prefSlugOf(r), r.listingArea, r.categoryOriginal)}#${r.id}`;
}
