import datasetJson from "@/data/phase1/nationwide_dataset_v1.json";
import mapJson from "@/data/phase1/map_47prefectures_v1.json";
import phase2Json from "@/data/phase2/participation_structure_2026.json";
import storesJson from "@/data/phase3/participating_stores_2026.json";
import confirmedStoresJson from "@/data/phase3/participating_stores_confirmed_2026.json";
import relationsJson from "@/data/phase3/store_category_relations.json";
import sourcesJson from "@/data/phase3/store_sources.json";
import campaignJson from "@/data/phase3/campaign_support_stores.json";
import coverageJson from "@/data/phase3/coverage_47prefectures.json";
import phase3bStoresJson from "@/data/phase3b/stores.json";
import phase3bRelationsJson from "@/data/phase3b/store_category_relations.json";
import phase3bSourcesJson from "@/data/phase3b/store_sources.json";
import phase3bCoverageJson from "@/data/phase3b/coverage_47prefectures.json";
import { updates } from "@/data/updates";
import { relationUpdates, sourceUpdates, storeUpdates } from "@/data/store-updates";
import { entrantSources, entrantUpdates } from "@/data/entrant-updates";
import type {
  Phase1Dataset,
  Phase1Map,
  Phase2CountFact,
  Phase3CampaignStore,
  Phase3Coverage,
  Phase3RawRelation,
  Phase3RawSource,
  Phase3RawStore,
  Phase3StoresFile,
  Phase3bCoveragePrefecture,
} from "@/data/types";
import { buildModel, type SiteModel } from "./model";
import { adaptAll } from "./phase1";
import { adaptStoreLayer } from "./phase3";
import {
  validateDatasetSummary,
  validateEntrantRecords,
  validateMap,
  validatePhase3,
  validateRecords,
  validateStoreUpdates,
} from "./validate";

/**
 * サイト全体が参照するデータの唯一の入口。
 *
 * 1. Phase 1 最終データ（観測）、Phase 3（参加店舗）、Phase 2（人数）の成果物を受け取ったまま読む
 *    （data/phase1・phase2・phase3。無変更）＋ 差分更新（data/updates.ts・data/store-updates.ts）
 * 2. レコード・地図データ・summary・Phase 3 の店舗/関係/カバレッジを検証する（error があればビルド失敗）
 * 3. アダプターで変換し、画面用の構造を作る
 */
export const phase1Dataset = datasetJson as unknown as Phase1Dataset;
export const phase1Map = mapJson as unknown as Phase1Map;
export const phase3Stores = storesJson as unknown as Phase3StoresFile;
export const phase3ConfirmedStores = (confirmedStoresJson as unknown as { stores: Phase3RawStore[] }).stores;
export const phase3Relations = (relationsJson as unknown as { relations: Phase3RawRelation[] }).relations;
export const phase3Sources = (sourcesJson as unknown as { sources: Phase3RawSource[] }).sources;
export const phase3Coverage = coverageJson as unknown as Phase3Coverage;
export const campaignSupportStores = (campaignJson as unknown as { stores: Phase3CampaignStore[] }).stores;
/** Phase 3b：全国走査（検索結果からの発見。調査側で生成した成果物） */
export const phase3b = {
  stores: (phase3bStoresJson as unknown as { stores: Phase3RawStore[] }).stores,
  relations: (phase3bRelationsJson as unknown as { relations: Phase3RawRelation[] }).relations,
  sources: (phase3bSourcesJson as unknown as { sources: Phase3RawSource[] }).sources,
  summary: (phase3bStoresJson as unknown as { summary: Record<string, unknown> }).summary,
  checkedAt: (phase3bStoresJson as unknown as { checkedAt: string }).checkedAt,
  coverage: (phase3bCoverageJson as unknown as { prefectures: Phase3bCoveragePrefecture[] }).prefectures,
};

const phase2 = phase2Json as unknown as { countFacts: Phase2CountFact[]; nationalApproximateScale: number | null };

function load(): SiteModel {
  const sets = { phase1: phase1Dataset.records, update: updates };
  const errors = [
    ...validateRecords(sets),
    ...validateMap(phase1Map, phase1Dataset.records),
    ...validateDatasetSummary(phase1Dataset),
    ...validatePhase3(
      {
        storesFile: phase3Stores,
        relations: phase3Relations,
        sources: phase3Sources,
        campaignStores: campaignSupportStores,
        coverage: phase3Coverage,
        confirmedStores: phase3ConfirmedStores,
      },
      phase1Dataset.records,
    ),
    // Phase 3b は Phase 3 に対して、個別の差分更新は Phase 3 ＋ Phase 3b に対して重複・形式を検証する
    ...validateStoreUpdates(
      phase3b,
      { stores: phase3Stores.stores, relations: phase3Relations, sources: phase3Sources },
      phase1Dataset.records,
      campaignSupportStores,
    ),
    ...validateStoreUpdates(
      { stores: storeUpdates, relations: relationUpdates, sources: sourceUpdates },
      {
        stores: [...phase3Stores.stores, ...phase3b.stores],
        relations: [...phase3Relations, ...phase3b.relations],
        sources: [...phase3Sources, ...phase3b.sources],
      },
      phase1Dataset.records,
      campaignSupportStores,
    ),
    // 出場者の記録は、すべての店舗・店舗×部門関係・情報源に対して検証する
    ...validateEntrantRecords(entrantUpdates, {
      stores: [...phase3Stores.stores, ...phase3b.stores, ...storeUpdates],
      relations: [...phase3Relations, ...phase3b.relations, ...relationUpdates],
      sources: [...phase3Sources, ...phase3b.sources, ...sourceUpdates],
    }, entrantSources),
  ].filter((i) => i.level === "error");
  if (errors.length > 0) {
    const detail = errors.map((e) => `[${e.dataset}] ${e.id}: ${e.message}`).join("\n");
    throw new Error(`データ検証エラーがあります:\n${detail}`);
  }
  const layer = adaptStoreLayer({
    stores: phase3Stores.stores,
    relations: phase3Relations,
    sources: phase3Sources,
    countFacts: phase2.countFacts,
    phase3b,
    updates: { stores: storeUpdates, relations: relationUpdates, sources: sourceUpdates },
    entrants: entrantUpdates,
    entrantSources,
  });
  return buildModel(adaptAll(sets), { mapInfo: phase1Map.prefectures, layer });
}

export const site: SiteModel = load();

export const datasetInfo = {
  event: phase1Dataset.event,
  datasetVersion: phase1Dataset.datasetVersion,
  frozenAt: phase1Dataset.frozenAt,
  scope: phase1Dataset.scope,
  phase3CheckedAt: (storesJson as { checkedAt?: string }).checkedAt ?? null,
  phase3Scope: (storesJson as { scope?: string }).scope ?? null,
  /** 公式媒体の案内による参加規模の概数（Phase 2。確定数ではない） */
  nationalApproximateScale: phase2.nationalApproximateScale,
};

/** 応援キャンペーンのみ確認された店舗（参加店舗の件数には含めない） */
export function campaignStoresIn(prefecture: string | undefined) {
  return campaignSupportStores.filter((c) => (c.prefecture ?? undefined) === prefecture);
}

/** Phase 3b 全国走査の都道府県別の調査状況 */
export function phase3bCoverageOf(prefecture: string) {
  return phase3b.coverage.find((c) => c.prefecture === prefecture) ?? null;
}
