import type { Confidence, MapStatus } from "@/data/types";
import { PREFECTURES, REGIONS, UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import { confidenceRank } from "./labels";
import { areaIdOf, entrantHref, type SiteModel } from "./model";
import { normalizeForSearch, tokenizeQuery } from "./text";

/**
 * 全国横断検索。検索対象は「都道府県・掲載地域・部門・店舗・出場者」の各ページ単位。
 * 索引（SearchItem[]）はビルド時にサーバーで作り、絞り込み・照合はクライアントで行う。
 */

export type SearchKind = "prefecture" | "area" | "division" | "store" | "entrant";

export const SEARCH_KIND_ORDER: readonly SearchKind[] = ["prefecture", "area", "division", "store", "entrant"];

export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  prefecture: "都道府県",
  area: "掲載地域",
  division: "部門",
  store: "店舗",
  entrant: "出場者",
};

export interface SearchItem {
  kind: SearchKind;
  id: string;
  /** 表示名（原文） */
  name: string;
  href: string;
  prefSlug: string;
  prefName: string;
  listingArea?: string;
  /** 所属する掲載地域ID（掲載地域フィルター用。未判明は "none"） */
  areaIds: string[];
  /** 補足表示（例: 部門の店舗、出場者の店舗・部門） */
  sub?: string;
  /** 都道府県以外の確認状態（含まれる観測の最も高いもの） */
  confidence?: Confidence;
  /** 都道府県の地図状態 */
  status?: MapStatus;
  /** 名称そのものの検索キー（正規化済み） */
  ownKeys: string[];
  /** 関連情報の検索キー（所在地・関連する部門/店舗/出場者。正規化済み） */
  contextKeys: string[];
  /** 都道府県が属する地方名（正規化済み）。都道府県名に一致しない語でだけ使う */
  regionKey?: string;
}

export interface SearchFilters {
  q?: string;
  kind?: SearchKind;
  /** 都道府県スラッグ（"unknown" = 地域未判明） */
  pref?: string;
  /** 掲載地域ID */
  area?: string;
  confidence?: Confidence;
}

export interface SearchHit {
  item: SearchItem;
  score: number;
}

const regionName = new Map(REGIONS.map((r) => [r.id, r.name]));
const prefectureKeys = PREFECTURES.flatMap((p) => [normalizeForSearch(p.name), p.slug]);
const prefCode = new Map(PREFECTURES.map((p) => [p.slug, p.code]));

/** 語が都道府県名に一致するか（一致するときは地方名での一致を使わない。「沖縄」で九州の他県を出さない） */
function matchesPrefectureName(token: string): boolean {
  return prefectureKeys.some((k) => k.includes(token));
}

const N = (xs: (string | undefined)[]) => xs.map(normalizeForSearch).filter((k) => k.length > 0);

export function buildSearchIndex(model: SiteModel): SearchItem[] {
  const items: SearchItem[] = [];
  const prefs = model.unknownPrefecture ? [...model.prefectures, model.unknownPrefecture] : model.prefectures;

  for (const p of prefs) {
    items.push({
      kind: "prefecture",
      id: p.slug,
      name: p.name,
      href: `/pref/${p.slug}`,
      prefSlug: p.slug,
      prefName: p.name,
      areaIds: [],
      status: p.slug === UNKNOWN_PREFECTURE_SLUG ? undefined : p.status,
      sub: `店舗 ${p.stores.length} ・ 観測 ${p.recordCount}件`,
      ownKeys: p.slug === UNKNOWN_PREFECTURE_SLUG ? N([p.name, "都道府県未判明"]) : [...N([p.name]), p.slug],
      contextKeys: [],
      regionKey: normalizeForSearch(regionName.get(p.regionId ?? "")),
    });
    for (const a of p.areas) {
      if (!a.name) continue;
      items.push({
        kind: "area",
        id: a.id,
        name: a.name,
        href: `/pref/${p.slug}/area/${a.id}`,
        prefSlug: p.slug,
        prefName: p.name,
        listingArea: a.name,
        areaIds: [a.id],
        sub: `部門 ${a.categoryNameCount} ・ 店舗 ${a.stores.length}`,
        confidence:
          a.divisions.length || a.stores.length
            ? bestOf([...a.divisions.map((d) => d.confidence), ...a.stores.map((x) => x.confidence)])
            : undefined,
        ownKeys: N([a.name]),
        contextKeys: N([p.name]),
      });
    }
  }

  for (const d of model.divisions) {
    items.push({
      kind: "division",
      id: d.id,
      name: d.categoryOriginal,
      href: `/division/${d.id}`,
      prefSlug: d.prefSlug,
      prefName: d.prefectureName,
      listingArea: d.listingArea,
      areaIds: [d.areaId],
      sub: d.stores.length ? `店舗：${d.stores.map((s) => s.name).join("、")}` : undefined,
      confidence: d.confidence,
      ownKeys: N([d.categoryOriginal, ...d.records.map((r) => r.categoryNormalized)]),
      contextKeys: N([
        d.prefectureName,
        d.listingArea,
        ...d.stores.map((s) => s.name),
        ...d.records.map((r) => r.storeName),
        ...d.records.flatMap((r) => r.entrantNames),
      ]),
    });
  }

  // 店舗（Phase 3 storeId）。初期読込を軽くするため、根拠・notes は入れない
  for (const s of model.stores) {
    items.push({
      kind: "store",
      id: s.id,
      name: s.name,
      href: `/store/${s.id}`,
      prefSlug: s.prefSlug,
      prefName: s.prefectureName,
      listingArea: s.listingAreas.join("・") || undefined,
      areaIds: s.listingAreas.length ? s.listingAreas.map((a) => areaIdOf(s.prefSlug, a)) : ["none"],
      sub: s.categoryOriginals.length ? s.categoryOriginals.join("、") : "部門名は未判明",
      confidence: s.confidence,
      ownKeys: N([s.name, ...s.nameOriginals]),
      contextKeys: N([s.prefectureName, ...s.listingAreas, ...s.categoryOriginals]),
    });
  }

  for (const e of model.entrants) {
    items.push({
      kind: "entrant",
      id: e.id,
      name: e.name,
      href: entrantHref(e),
      prefSlug: e.prefSlug,
      prefName: e.prefectureName,
      listingArea: e.listingAreas.join("・") || undefined,
      // 観測のない出場者（店舗×部門関係の根拠に書かれた名前）は店舗の掲載地域で絞り込む
      areaIds: (e.records.length
        ? e.records.map((r) => areaIdOf(e.prefSlug, r.listingArea))
        : e.listingAreas.length
          ? e.listingAreas.map((a) => areaIdOf(e.prefSlug, a))
          : ["none"]
      ).filter((v, i, a) => a.indexOf(v) === i),
      sub: [e.storeName && `店舗：${e.storeName}`, e.divisions.map((d) => d.categoryOriginal).join("、")].filter(Boolean).join(" ・ "),
      confidence: e.confidence,
      ownKeys: N([e.name]),
      contextKeys: N([e.prefectureName, ...e.listingAreas, e.storeName, ...e.divisions.map((d) => d.categoryOriginal)]),
    });
  }
  return items;
}

function bestOf(list: Confidence[]): Confidence {
  return [...list].sort((a, b) => confidenceRank(a) - confidenceRank(b))[0];
}

function scoreKey(key: string, token: string): number {
  if (key === token) return 3;
  if (key.startsWith(token)) return 2;
  if (key.includes(token)) return 1;
  return 0;
}

/**
 * 検索。
 * - 部分一致（正規化後）。空白区切りの複数語は AND
 * - 名称そのものの一致を、関連情報（所在地・関連部門など）の一致より上位にする
 * - 検索語が空なら絞り込みだけを適用する
 */
export function searchItems(items: readonly SearchItem[], filters: SearchFilters): SearchHit[] {
  const tokens = tokenizeQuery(filters.q);
  const hits: SearchHit[] = [];
  for (const item of items) {
    if (filters.kind && item.kind !== filters.kind) continue;
    if (filters.pref && item.prefSlug !== filters.pref) continue;
    if (filters.area && !item.areaIds.includes(filters.area)) continue;
    if (filters.confidence && item.confidence !== filters.confidence) continue;

    let score = 0;
    let ok = true;
    for (const t of tokens) {
      let best = 0;
      for (const k of item.ownKeys) best = Math.max(best, scoreKey(k, t) * 2);
      if (best === 0 && item.contextKeys.some((k) => k.includes(t))) best = 1;
      if (best === 0 && item.regionKey?.includes(t) && !matchesPrefectureName(t)) best = 1;
      if (best === 0) {
        ok = false;
        break;
      }
      score += best;
    }
    if (ok) hits.push({ item, score });
  }
  const kindRank = (k: SearchKind) => SEARCH_KIND_ORDER.indexOf(k);
  return hits.sort(
    (a, b) =>
      b.score - a.score ||
      kindRank(a.item.kind) - kindRank(b.item.kind) ||
      confidenceRank(a.item.confidence ?? "unverified") - confidenceRank(b.item.confidence ?? "unverified") ||
      (prefCode.get(a.item.prefSlug) ?? 99) - (prefCode.get(b.item.prefSlug) ?? 99) ||
      a.item.name.localeCompare(b.item.name, "ja"),
  );
}
