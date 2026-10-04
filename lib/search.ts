import type { Confidence, DataRecord, Dataset } from "@/data/types";
import { PREFECTURES, REGIONS, findPrefectureByName } from "@/data/geo";
import { confidenceRank } from "./labels";
import { areaIdOf, prefSlugOf, type SiteModel } from "./model";
import { normalizeForSearch, tokenizeQuery } from "./text";

export interface SearchFilters {
  /** 検索語（空白区切りでAND） */
  q?: string;
  /** 都道府県スラッグ（"unknown" = 都道府県未判明） */
  pref?: string;
  /** エリアID（model.areaIdOf） */
  area?: string;
  confidence?: Confidence;
  dataset?: Dataset;
}

export interface SearchHit {
  record: DataRecord;
  score: number;
  /** 一致した項目 */
  matched: SearchField[];
}

export type SearchField = "prefecture" | "area" | "category" | "entrant" | "store";

export const SEARCH_FIELD_LABEL: Record<SearchField, string> = {
  prefecture: "都道府県",
  area: "エリア",
  category: "部門",
  entrant: "出場者",
  store: "店舗",
};

interface IndexedRecord {
  record: DataRecord;
  prefSlug: string;
  areaId: string;
  prefCode: number;
  regionKey: string;
  fields: { field: SearchField; keys: string[] }[];
}

const regionName = new Map(REGIONS.map((r) => [r.id, r.name]));
const prefectureKeys = PREFECTURES.flatMap((p) => [normalizeForSearch(p.name), p.slug]);

/**
 * 地方名で探せるのは、検索語が都道府県名に一致しない場合だけ
 * （「沖縄」で「九州・沖縄」地方の他県まで出さないため）。
 */
function matchesPrefectureName(token: string): boolean {
  return prefectureKeys.some((k) => k.includes(token));
}

function indexRecord(record: DataRecord): IndexedRecord {
  const pref = findPrefectureByName(record.prefecture);
  const prefSlug = prefSlugOf(record);
  const prefKeys = pref ? [normalizeForSearch(pref.name), pref.slug] : [];
  const regionKey = pref ? normalizeForSearch(regionName.get(pref.regionId)) : "";
  return {
    record,
    prefSlug,
    areaId: areaIdOf(prefSlug, record.area),
    prefCode: pref?.code ?? 999,
    regionKey,
    fields: [
      { field: "prefecture", keys: prefKeys },
      { field: "area", keys: [normalizeForSearch(record.area)] },
      {
        field: "category",
        keys: [
          normalizeForSearch(record.categoryOriginal),
          normalizeForSearch(record.categoryNormalized),
        ],
      },
      { field: "entrant", keys: [normalizeForSearch(record.entrantName)] },
      { field: "store", keys: [normalizeForSearch(record.storeName)] },
    ],
  };
}

function scoreKey(key: string, token: string): number {
  if (!key) return 0;
  if (key === token) return 3;
  if (key.startsWith(token)) return 2;
  if (key.includes(token)) return 1;
  return 0;
}

/**
 * 全国横断検索。
 * - 部分一致（正規化後の文字列に対して）
 * - 空白区切りの複数語は AND（各語がいずれかの項目に一致）
 * - 絞り込み（都道府県・エリア・確認状態・区分）と組み合わせ可能
 * - 検索語が空なら、絞り込みだけを適用した全件を返す
 */
export function searchRecords(records: readonly DataRecord[], filters: SearchFilters): SearchHit[] {
  const tokens = tokenizeQuery(filters.q);
  const hits: (SearchHit & { prefCode: number })[] = [];

  for (const record of records) {
    const ix = indexRecord(record);
    if (filters.pref && ix.prefSlug !== filters.pref) continue;
    if (filters.area && ix.areaId !== filters.area) continue;
    if (filters.confidence && record.confidence !== filters.confidence) continue;
    if (filters.dataset && record.dataset !== filters.dataset) continue;

    let score = 0;
    const matched = new Set<SearchField>();
    let all = true;
    for (const token of tokens) {
      let best = 0;
      for (const { field, keys } of ix.fields) {
        const s = Math.max(...keys.map((k) => scoreKey(k, token)));
        if (s > 0) matched.add(field);
        best = Math.max(best, s);
      }
      if (best === 0 && ix.regionKey.includes(token) && !matchesPrefectureName(token)) {
        matched.add("prefecture");
        best = 1;
      }
      if (best === 0) {
        all = false;
        break;
      }
      score += best;
    }
    if (!all) continue;
    hits.push({ record, score, matched: [...matched], prefCode: ix.prefCode });
  }

  hits.sort(
    (a, b) =>
      b.score - a.score ||
      confidenceRank(a.record.confidence) - confidenceRank(b.record.confidence) ||
      a.prefCode - b.prefCode ||
      a.record.id.localeCompare(b.record.id),
  );
  return hits.map(({ record, score, matched }) => ({ record, score, matched }));
}

/** 場所検索用の軽量インデックス（クライアントへ渡す） */
export interface PlaceIndex {
  prefectures: { slug: string; name: string; regionName: string; recordCount: number }[];
  areas: { id: string; name: string; prefSlug: string; prefName: string; recordCount: number }[];
}

export function buildPlaceIndex(model: SiteModel): PlaceIndex {
  const prefs = model.unknownPrefecture
    ? [...model.prefectures, model.unknownPrefecture]
    : model.prefectures;
  return {
    prefectures: model.prefectures.map((p) => ({
      slug: p.slug,
      name: p.name,
      regionName: regionName.get(p.regionId ?? "") ?? "",
      recordCount: p.recordCount,
    })),
    areas: prefs.flatMap((p) =>
      p.areas
        .filter((a) => a.name)
        .map((a) => ({
          id: a.id,
          name: a.name!,
          prefSlug: p.slug,
          prefName: p.name,
          recordCount: a.recordCount,
        })),
    ),
  };
}

/** 検索語に一致する都道府県・エリア（検索結果上部の「場所」候補用） */
export function searchPlaces(index: PlaceIndex, q: string | undefined) {
  const tokens = tokenizeQuery(q);
  if (tokens.length === 0) return { prefectures: [], areas: [] };
  const matchAll = (keys: string[]) =>
    tokens.every((t) => keys.some((k) => k.length > 0 && k.includes(t)));

  const prefectures = index.prefectures.filter((p) =>
    matchAll(
      [p.name, p.slug, ...(tokens.some(matchesPrefectureName) ? [] : [p.regionName])].map(
        normalizeForSearch,
      ),
    ),
  );
  const areas = index.areas.filter((a) =>
    matchAll([normalizeForSearch(a.name), normalizeForSearch(`${a.prefName}${a.name}`)]),
  );
  return { prefectures, areas };
}
