import type {
  Confidence,
  Dataset,
  MapStatus,
  Phase1MapPrefecture,
  SiteRecord,
  SiteRelation,
  SiteSource,
  SiteStore,
  StoreCountFact,
  StoreLayer,
} from "@/data/types";
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
 * 地図の状態。Phase 1・Phase 3 の定義どおり:
 * confirmed = confirmed の観測または参加店舗あり / candidate = probable・unverified のみ /
 * searched_no_evidence = 観測・参加店舗なし（「調査済みだが現在情報未発見」であり、不存在を意味しない）
 */
export function deriveStatus(
  records: readonly { confidence: Confidence }[],
  stores: readonly { confidence: Confidence }[] = [],
): MapStatus {
  if (records.some((r) => r.confidence === "confirmed") || stores.some((s) => s.confidence === "confirmed")) {
    return "confirmed";
  }
  if (records.length > 0 || stores.length > 0) return "candidate";
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

export function prefSlugOf(r: { prefecture?: string }): string {
  return findPrefectureByName(r.prefecture)?.slug ?? UNKNOWN_PREFECTURE_SLUG;
}

export function areaIdOf(prefSlug: string, listingArea: string | undefined): string {
  return listingArea ? `a${stableHash(`${prefSlug}|${listingArea}`)}` : "none";
}

export function divisionIdOf(prefSlug: string, listingArea: string | undefined, category: string): string {
  return `d${stableHash(`${prefSlug}|${listingArea ?? ""}|${category}`)}`;
}

/** v1 までの店舗URL用ID（都道府県×店舗名）。既存URLを維持するためだけに使う */
export function storeIdOf(prefSlug: string, storeName: string): string {
  return `s${stableHash(`${prefSlug}|${storeName}`)}`;
}

export function compareKeyOf(r: Pick<SiteRecord, "categoryOriginal" | "categoryNormalized">): string {
  return normalizeForSearch(r.categoryNormalized ?? r.categoryOriginal);
}

/* ───────────── 画面用の構造 ───────────── */

/** 部門 = 都道府県 × 掲載地域 × 部門名（原文）。Phase 1 の観測と Phase 3 の店舗×部門関係の両方から作る */
export interface Division {
  id: string;
  prefSlug: string;
  prefectureName: string;
  listingArea?: string;
  areaId: string;
  categoryOriginal: string;
  /** 検索・比較補助キー */
  compareKey: string;
  /** Phase 1 の観測 */
  records: SiteRecord[];
  /** この部門に関係する参加店舗（Phase 3 の店舗×部門関係） */
  stores: DivisionStore[];
  confidence: Confidence;
  entrantCount: number;
}

export interface DivisionStore {
  id: string;
  name: string;
  /** 店舗×部門の関係の確認状態 */
  relationConfidence: Confidence;
  /** 店舗の参加情報の確認状態（店舗ページと同じもの） */
  storeConfidence: Confidence;
  hasPublicUrl: boolean;
}

export interface StoreCategory {
  relationId: string;
  categoryOriginal: string;
  confidence: Confidence;
  divisionId: string;
}

export interface StoreView extends SiteStore {
  prefSlug: string;
  prefectureName: string;
  /** v1 までの店舗URL ID（互換用） */
  legacyIds: string[];
  /** 関連する部門（原文。多対多） */
  categories: StoreCategory[];
  divisions: Division[];
  /** この店舗に結び付く Phase 1 の観測（phase1RecordIds） */
  records: SiteRecord[];
  entrantNames: string[];
  /** 参加根拠URLの情報源メタデータ（store_sources） */
  evidenceSource?: SiteSource;
  publicSource?: SiteSource;
  countFacts: StoreCountFact[];
}

/** 出場者 = 都道府県 × 店舗名 × 人物名（Phase 1 の既存人物情報。同姓同名の別人を自動統合しない） */
export interface EntrantView {
  id: string;
  name: string;
  prefSlug: string;
  prefectureName: string;
  storeName?: string;
  /** Phase 3 店舗ID（観測IDで確実に接続できた場合のみ） */
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
  /** 部門（原文）の種類数（観測＋店舗×部門関係） */
  categoryNameCount: number;
}

/** 店舗の集計 */
export interface StoreSummary {
  storeCount: number;
  byConfidence: Record<Confidence, number>;
  publicUrlCount: number;
  newSincePhase1: number;
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
  /** Phase 1 観測の集計 */
  summary: Summary;
  /** Phase 3 店舗の集計 */
  storeSummary: StoreSummary;
  /** 部門（原文）の種類数（観測＋店舗×部門関係） */
  categoryNameCount: number;
  /** 掲載地域の種類数（観測＋店舗） */
  listingAreaCount: number;
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
  /** 観測または参加店舗がある都道府県数 */
  prefecturesWithData: number;
  /** 都道府県未判明の観測数 */
  unknownPrefectureRecordCount: number;
  /** 参加店舗の集計（候補を含む） */
  stores: StoreSummary & { unknownPrefectureStoreCount: number; relationCount: number; storeCategoryCount: number };
  /** 部門（原文）の種類数（観測＋店舗×部門関係） */
  allCategoryNameCount: number;
  /** 掲載地域の種類数（観測＋店舗） */
  allListingAreaCount: number;
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
  /** Phase 1 観測ID → Phase 3 店舗ID（phase1RecordIds による確実な接続のみ） */
  storeIdByRecord: Record<string, string>;
}

function sortRecords(list: SiteRecord[]): SiteRecord[] {
  return [...list].sort(
    (a, b) =>
      confidenceRank(a.confidence) - confidenceRank(b.confidence) ||
      compareJa(a.storeName ?? "\uffff", b.storeName ?? "\uffff") ||
      compareJa(a.entrantNames[0] ?? "\uffff", b.entrantNames[0] ?? "\uffff") ||
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

const EMPTY_LAYER: StoreLayer = { stores: [], relations: [], sources: [], countFacts: [] };

/** 店舗の掲載地域（複数ある場合は勝手に1つに決めない。なければ「未判明」1つ） */
function storeAreas(s: SiteStore): (string | undefined)[] {
  return s.listingAreas.length > 0 ? s.listingAreas : [undefined];
}

export function summarizeStores(stores: readonly SiteStore[]): StoreSummary {
  return {
    storeCount: new Set(stores.map((s) => s.id)).size,
    byConfidence: {
      confirmed: stores.filter((s) => s.confidence === "confirmed").length,
      probable: stores.filter((s) => s.confidence === "probable").length,
      unverified: stores.filter((s) => s.confidence === "unverified").length,
    },
    publicUrlCount: stores.filter((s) => s.storePublicUrl).length,
    newSincePhase1: stores.filter((s) => s.isNewSincePhase1).length,
  };
}

export function buildModel(
  records: SiteRecord[],
  options: { mapInfo?: readonly Phase1MapPrefecture[]; layer?: StoreLayer } = {},
): SiteModel {
  const mapInfo = options.mapInfo ?? [];
  const layer = options.layer ?? EMPTY_LAYER;
  const storeById = new Map(layer.stores.map((s) => [s.id, s]));
  const sourceById = new Map(layer.sources.map((s) => [s.id, s]));
  /** Phase 1 観測ID → Phase 3 店舗ID（phase1RecordIds による確実な接続のみ） */
  const storeOfRecord = new Map<string, string>();
  for (const s of layer.stores) for (const rid of s.phase1RecordIds) storeOfRecord.set(rid, s.id);

  // 1) 部門（観測 ＋ 店舗×部門関係）
  type DivKey = { prefSlug: string; prefectureName: string; listingArea?: string; categoryOriginal: string; categoryNormalized?: string };
  const divInfo = new Map<string, DivKey>();
  const divRecords = new Map<string, SiteRecord[]>();
  const divRelations = new Map<string, SiteRelation[]>();
  const touch = (k: DivKey) => {
    const id = divisionIdOf(k.prefSlug, k.listingArea, k.categoryOriginal);
    const prev = divInfo.get(id);
    if (!prev || (!prev.categoryNormalized && k.categoryNormalized)) divInfo.set(id, k);
    return id;
  };
  for (const r of records) {
    const id = touch({
      prefSlug: prefSlugOf(r),
      prefectureName: r.prefecture ?? UNKNOWN_PREFECTURE_LABEL,
      listingArea: r.listingArea,
      categoryOriginal: r.categoryOriginal,
      categoryNormalized: r.categoryNormalized,
    });
    divRecords.set(id, [...(divRecords.get(id) ?? []), r]);
  }
  for (const rel of layer.relations) {
    const s = storeById.get(rel.storeId);
    if (!s) continue;
    for (const area of storeAreas(s)) {
      const id = touch({
        prefSlug: prefSlugOf(s),
        prefectureName: s.prefecture ?? UNKNOWN_PREFECTURE_LABEL,
        listingArea: area,
        categoryOriginal: rel.categoryOriginal,
        categoryNormalized: rel.categoryNormalized,
      });
      divRelations.set(id, [...(divRelations.get(id) ?? []), rel]);
    }
  }
  const divisions: Division[] = [...divInfo.entries()].map(([id, k]) => {
    const list = divRecords.get(id) ?? [];
    const rels = divRelations.get(id) ?? [];
    const stores: DivisionStore[] = [...groupBy(rels, (r) => r.storeId).entries()]
      .map(([storeId, rs]) => ({
        id: storeId,
        name: storeById.get(storeId)!.name,
        relationConfidence: bestConfidence(rs),
        storeConfidence: storeById.get(storeId)!.confidence,
        hasPublicUrl: !!storeById.get(storeId)!.storePublicUrl,
      }))
      .sort((a, b) => confidenceRank(a.relationConfidence) - confidenceRank(b.relationConfidence) || compareJa(a.name, b.name));
    return {
      id,
      prefSlug: k.prefSlug,
      prefectureName: k.prefectureName,
      listingArea: k.listingArea,
      areaId: areaIdOf(k.prefSlug, k.listingArea),
      categoryOriginal: k.categoryOriginal,
      compareKey: compareKeyOf(k),
      records: sortRecords(list),
      stores,
      confidence: bestConfidence([...list, ...rels.map((r) => ({ confidence: r.confidence }))]),
      entrantCount: new Set(list.flatMap((r) => r.entrantNames.map((n) => `${r.storeName ?? ""}|${n}`))).size,
    };
  });
  divisions.sort(
    (a, b) =>
      prefOrder(a.prefSlug) - prefOrder(b.prefSlug) ||
      compareJa(a.listingArea ?? "\uffff", b.listingArea ?? "\uffff") ||
      compareJa(a.categoryOriginal, b.categoryOriginal),
  );
  const divisionById = new Map(divisions.map((d) => [d.id, d]));
  const divisionOfRecord = (r: SiteRecord) =>
    divisionById.get(divisionIdOf(prefSlugOf(r), r.listingArea, r.categoryOriginal))!;
  const recordById = new Map(records.map((r) => [r.id, r]));

  // 2) 店舗（Phase 3 storeId が主キー）
  const stores: StoreView[] = layer.stores
    .map((s) => {
      const prefSlug = prefSlugOf(s);
      const recs = s.phase1RecordIds.map((rid) => recordById.get(rid)).filter((r): r is SiteRecord => !!r);
      const rels = layer.relations.filter((r) => r.storeId === s.id);
      const categories: StoreCategory[] = rels.flatMap((rel) =>
        storeAreas(s).map((area) => ({
          relationId: rel.id,
          categoryOriginal: rel.categoryOriginal,
          confidence: rel.confidence,
          divisionId: divisionIdOf(prefSlug, area, rel.categoryOriginal),
        })),
      );
      const sourceOf = (url?: string) =>
        url ? s.sourceIds.map((id) => sourceById.get(id)).find((src) => src?.url === url) : undefined;
      return {
        ...s,
        prefSlug,
        prefectureName: s.prefecture ?? UNKNOWN_PREFECTURE_LABEL,
        legacyIds: uniq(recs.map((r) => (r.storeName ? storeIdOf(prefSlugOf(r), r.storeName) : undefined))),
        categories,
        divisions: uniq(categories.map((c) => c.divisionId)).map((id) => divisionById.get(id)!).filter(Boolean),
        records: sortRecords(recs),
        entrantNames: uniq(recs.flatMap((r) => r.entrantNames)),
        evidenceSource: sourceOf(s.participationEvidenceUrl),
        publicSource: sourceOf(s.storePublicUrl),
        countFacts: layer.countFacts.filter((c) => c.storeId === s.id),
      };
    })
    .sort(
      (a, b) =>
        prefOrder(a.prefSlug) - prefOrder(b.prefSlug) ||
        confidenceRank(a.confidence) - confidenceRank(b.confidence) ||
        compareJa(a.name, b.name),
    );

  // 3) 出場者（Phase 1 の既存人物情報 ＋ 店舗×部門関係の根拠に書かれた出場者名）
  const entrantRows = records.flatMap((r) => r.entrantNames.map((name) => ({ r, name })));
  const phase1Entrants: EntrantView[] = [
    ...groupBy(entrantRows, ({ r, name }) => `${prefSlugOf(r)}|${r.storeName ?? ""}|${name}`).entries(),
  ]
    .map(([key, rows]) => {
      const r0 = rows[0].r;
      const list = rows.map((x) => x.r);
      const storeIds = uniq(list.map((r) => storeOfRecord.get(r.id)));
      return {
        id: `e${stableHash(key)}`,
        name: rows[0].name,
        prefSlug: prefSlugOf(r0),
        prefectureName: r0.prefecture ?? UNKNOWN_PREFECTURE_LABEL,
        storeName: r0.storeName,
        // 観測IDで1店舗に確実に接続できる場合のみ
        storeId: storeIds.length === 1 ? storeIds[0] : undefined,
        listingAreas: uniq(list.map((r) => r.listingArea)).sort(compareJa),
        records: sortRecords(list),
        divisions: [...new Set(list.map(divisionOfRecord))],
        confidence: bestConfidence(list),
      };
    })
    .sort(
      (a, b) =>
        prefOrder(a.prefSlug) - prefOrder(b.prefSlug) ||
        compareJa(a.storeName ?? "\uffff", b.storeName ?? "\uffff") ||
        compareJa(a.name, b.name),
    );

  // 店舗×部門関係（差分更新など Phase 1 の観測を持たない店舗）の根拠に書かれた出場者名。
  // 同じ都道府県・店舗名・名前の出場者が Phase 1 にあれば、そちらを優先して重複させない
  const entrantKey = (prefSlug: string, storeName: string | undefined, name: string) =>
    `${prefSlug}|${normalizeForSearch(storeName)}|${normalizeForSearch(name)}`;
  const knownEntrants = new Set(phase1Entrants.map((e) => entrantKey(e.prefSlug, e.storeName, e.name)));
  const relationEntrantRows = layer.relations.flatMap((rel) => {
    const st = storeById.get(rel.storeId);
    return st ? (rel.entrantNames ?? []).map((name) => ({ rel, st, name })) : [];
  });
  const relationEntrants: EntrantView[] = [
    ...groupBy(relationEntrantRows, ({ st, name }) => `${prefSlugOf(st)}|${st.id}|${name}`).entries(),
  ]
    .filter(([, rows]) => !knownEntrants.has(entrantKey(prefSlugOf(rows[0].st), rows[0].st.name, rows[0].name)))
    .map(([key, rows]) => {
      const st = rows[0].st;
      const rels = rows.map((x) => x.rel);
      const divIds = new Set(
        rels.flatMap((rel) => storeAreas(st).map((area) => divisionIdOf(prefSlugOf(st), area, rel.categoryOriginal))),
      );
      return {
        id: `e${stableHash(`rel|${key}`)}`,
        name: rows[0].name,
        prefSlug: prefSlugOf(st),
        prefectureName: st.prefecture ?? UNKNOWN_PREFECTURE_LABEL,
        storeName: st.name,
        storeId: st.id,
        listingAreas: [...st.listingAreas].sort(compareJa),
        records: [],
        divisions: divisions.filter((d) => divIds.has(d.id)),
        confidence: bestConfidence(rels),
      };
    });
  const entrants: EntrantView[] = [...phase1Entrants, ...relationEntrants].sort(
    (a, b) =>
      prefOrder(a.prefSlug) - prefOrder(b.prefSlug) ||
      compareJa(a.storeName ?? "\uffff", b.storeName ?? "\uffff") ||
      compareJa(a.name, b.name),
  );

  // 4) 都道府県 → 掲載地域
  const buildPref = (slug: string, name: string, code: number | null, regionId: string | null): PrefectureView => {
    const prefRecords = records.filter((r) => prefSlugOf(r) === slug);
    const prefStores = stores.filter((s) => s.prefSlug === slug);
    const prefDivisions = divisions.filter((d) => d.prefSlug === slug);
    const areaNames = new Set<string | undefined>([
      ...prefRecords.map((r) => r.listingArea),
      ...prefStores.flatMap(storeAreas),
      ...prefDivisions.map((d) => d.listingArea),
    ]);
    const areas: AreaView[] = [...areaNames]
      .map((areaName) => {
        const id = areaIdOf(slug, areaName);
        const inArea = prefRecords.filter((r) => r.listingArea === areaName);
        const areaDivisions = prefDivisions.filter((d) => d.areaId === id);
        return {
          id,
          prefSlug: slug,
          name: areaName,
          label: areaName ?? UNKNOWN_AREA_LABEL,
          divisions: areaDivisions,
          stores: prefStores.filter((s) => storeAreas(s).includes(areaName)),
          recordCount: inArea.length,
          summary: summarize(inArea),
          categoryNameCount: new Set(areaDivisions.map((d) => d.categoryOriginal)).size,
        };
      })
      .sort((a, b) => (a.name ? (b.name ? compareJa(a.name, b.name) : -1) : b.name ? 1 : 0));
    const info = mapInfo.find((m) => m.prefecture === name);
    return {
      slug,
      name,
      code,
      regionId,
      status: deriveStatus(prefRecords, prefStores),
      areas,
      divisions: prefDivisions,
      stores: prefStores,
      entrants: entrants.filter((e) => e.prefSlug === slug),
      recordCount: prefRecords.length,
      summary: summarize(prefRecords),
      storeSummary: summarizeStores(prefStores),
      categoryNameCount: new Set(prefDivisions.map((d) => d.categoryOriginal)).size,
      listingAreaCount: areas.filter((a) => a.name).length,
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
  const allPrefs = [...prefectures, unknown];
  const stats: Stats = {
    ...summarize(records),
    prefectureTotal: prefectures.length,
    statusCounts,
    prefecturesWithData: prefectures.filter((p) => p.recordCount > 0 || p.stores.length > 0).length,
    unknownPrefectureRecordCount: unknown.recordCount,
    stores: {
      ...summarizeStores(layer.stores),
      unknownPrefectureStoreCount: unknown.stores.length,
      relationCount: layer.relations.length,
      storeCategoryCount: new Set(layer.relations.map((r) => r.categoryOriginal)).size,
    },
    allCategoryNameCount: new Set(divisions.map((d) => d.categoryOriginal)).size,
    allListingAreaCount: allPrefs.reduce((n, p) => n + p.listingAreaCount, 0),
  };

  return {
    records,
    prefectures,
    unknownPrefecture: unknown.recordCount > 0 || unknown.stores.length > 0 ? unknown : null,
    divisions,
    stores,
    entrants,
    categories,
    stats,
    storeIdByRecord: Object.fromEntries(storeOfRecord),
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

/** Phase 3 storeId、または v1 までの店舗URL ID で店舗を探す */
export function findStore(model: SiteModel, id: string): StoreView | null {
  return model.stores.find((s) => s.id === id) ?? model.stores.find((s) => s.legacyIds.includes(id)) ?? null;
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

/** 出場者の遷移先: 店舗に確実に接続できれば店舗ページ、なければ部門の該当観測 */
export function entrantHref(e: EntrantView): string {
  if (e.storeId) return `/store/${e.storeId}#${e.id}`;
  const r = e.records[0];
  return `/division/${divisionIdOf(prefSlugOf(r), r.listingArea, r.categoryOriginal)}#${r.id}`;
}
