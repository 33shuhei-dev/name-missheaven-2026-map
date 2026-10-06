import type {
  Confidence,
  Phase2CountFact,
  Phase3RawRelation,
  Phase3RawSource,
  Phase3RawStore,
  SiteRelation,
  SiteSource,
  SiteStore,
  SourceType,
  StoreCountFact,
  StoreLayer,
} from "@/data/types";

/**
 * Phase 3（参加店舗）と Phase 2（人数）の追加レイヤーのアダプター。
 *
 * - Phase 3 の storeId を店舗の主キーとして使う（店名をキーにしない）
 * - null → undefined にするだけで、店名・部門名などの文字列は変更しない
 * - confidence は Phase 3 の値をそのまま使う（URLの有無で昇格させない）
 * - formalElectionArea は元データにある値だけ。listingArea・住所から補完しない
 */

const opt = (v: unknown): string | undefined => (typeof v === "string" && v.length > 0 ? v : undefined);

export function adaptStore(raw: Phase3RawStore, origin: SiteStore["origin"] = "phase3"): SiteStore {
  return {
    id: raw.storeId,
    origin,
    name: raw.storeName,
    nameOriginals: [...raw.storeNameOriginals],
    prefecture: opt(raw.prefecture),
    listingAreas: [...raw.listingAreas],
    formalElectionArea: opt(raw.formalElectionArea),
    categoryOriginals: [...raw.categoryOriginals],
    storePublicUrl: opt(raw.storePublicUrl),
    publicUrlAccessStatus: opt(raw.publicUrlAccessStatus),
    participationEvidenceUrl: opt(raw.participationEvidenceUrl),
    sourceType: raw.sourceType as SourceType,
    confidence: raw.confidence as Confidence,
    participationType: raw.participationType,
    isNewSincePhase1: raw.isNewSincePhase1 === true,
    phase1RecordIds: [...raw.phase1RecordIds],
    sourceIds: [...raw.sourceIds],
    checkedAt: opt(raw.checkedAt),
    notes: opt(raw.notes),
    verificationMethod: opt(raw.verificationMethod),
    evidencePageCount: typeof raw.evidencePageCount === "number" ? raw.evidencePageCount : undefined,
  };
}

export function adaptRelation(raw: Phase3RawRelation): SiteRelation {
  return {
    id: raw.relationId,
    storeId: raw.storeId,
    categoryOriginal: raw.categoryOriginal,
    categoryNormalized: opt(raw.categoryNormalized),
    confidence: raw.confidence as Confidence,
    sourceIds: [...raw.sourceIds],
    phase1RecordIds: [...raw.phase1RecordIds],
    entrantNames: Array.isArray(raw.entrantNames) ? raw.entrantNames.filter((n) => typeof n === "string" && n.trim() !== "") : [],
  };
}

export function adaptSource(raw: Phase3RawSource): SiteSource {
  return {
    id: raw.sourceId,
    url: raw.url,
    sourceType: raw.sourceType as SourceType,
    accessStatus: raw.accessStatus,
    publisherRole: raw.publisherRole,
  };
}

/**
 * Phase 2 の人数情報のうち、店舗単位（scope=store）・confirmed・人数が数値で、
 * 店名（表記揺れ含む）と都道府県が Phase 3 の店舗1件だけに完全一致するものを店舗に結び付ける。
 * 一致しないもの・複数一致するものは結び付けない（推測で接続しない）。
 */
export function linkCountFacts(facts: readonly Phase2CountFact[], stores: readonly SiteStore[]): StoreCountFact[] {
  const out: StoreCountFact[] = [];
  for (const f of facts) {
    if (f.scope !== "store" || f.confidence !== "confirmed" || typeof f.participantCount !== "number") continue;
    if (!f.storeName || !f.prefecture) continue;
    const matches = stores.filter(
      (s) => s.prefecture === f.prefecture && (s.name === f.storeName || s.nameOriginals.includes(f.storeName!)),
    );
    if (matches.length !== 1) continue;
    out.push({
      id: f.id,
      storeId: matches[0].id,
      countType: f.countType,
      participantCount: f.participantCount,
      sourceUrl: opt(f.sourceUrl),
      notes: opt(f.notes),
    });
  }
  return out;
}

export interface StoreLayerInput {
  stores: readonly Phase3RawStore[];
  relations: readonly Phase3RawRelation[];
  sources: readonly Phase3RawSource[];
}

export function adaptStoreLayer(input: {
  stores: readonly Phase3RawStore[];
  relations: readonly Phase3RawRelation[];
  sources: readonly Phase3RawSource[];
  countFacts: readonly Phase2CountFact[];
  /** Phase 3 以降の差分更新（data/store-updates.ts） */
  updates?: StoreLayerInput;
  /** Phase 3b 全国走査（data/phase3b） */
  phase3b?: StoreLayerInput;
}): StoreLayer {
  const stores = [
    ...input.stores.map((s) => adaptStore(s, "phase3")),
    ...(input.phase3b?.stores ?? []).map((s) => adaptStore(s, "phase3b")),
    ...(input.updates?.stores ?? []).map((s) => adaptStore(s, "update")),
  ];
  return {
    stores,
    relations: [...input.relations, ...(input.phase3b?.relations ?? []), ...(input.updates?.relations ?? [])].map(adaptRelation),
    sources: [...input.sources, ...(input.phase3b?.sources ?? []), ...(input.updates?.sources ?? [])].map(adaptSource),
    countFacts: linkCountFacts(input.countFacts, stores),
  };
}
