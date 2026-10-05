import datasetJson from "@/data/phase1/nationwide_dataset_v1.json";
import mapJson from "@/data/phase1/map_47prefectures_v1.json";
import { updates } from "@/data/updates";
import type { Phase1Dataset, Phase1Map } from "@/data/types";
import { buildModel, type SiteModel } from "./model";
import { adaptAll } from "./phase1";
import { validateDatasetSummary, validateMap, validateRecords } from "./validate";

/**
 * サイト全体が参照するデータの唯一の入口。
 *
 * 1. Phase 1 最終データ（data/phase1/*.json。受け取ったまま無変更）と差分更新（data/updates.ts）を読む
 * 2. レコード・地図データ・summary を検証する（error があればビルドを失敗させる）
 * 3. アダプターで SiteRecord に変換し、画面用の構造を作る
 */
export const phase1Dataset = datasetJson as unknown as Phase1Dataset;
export const phase1Map = mapJson as unknown as Phase1Map;

function load(): SiteModel {
  const sets = { phase1: phase1Dataset.records, update: updates };
  const errors = [
    ...validateRecords(sets),
    ...validateMap(phase1Map, phase1Dataset.records),
    ...validateDatasetSummary(phase1Dataset),
  ].filter((i) => i.level === "error");
  if (errors.length > 0) {
    const detail = errors.map((e) => `[${e.dataset}] ${e.id}: ${e.message}`).join("\n");
    throw new Error(`データ検証エラーがあります:\n${detail}`);
  }
  return buildModel(adaptAll(sets), phase1Map.prefectures);
}

export const site: SiteModel = load();

export const datasetInfo = {
  event: phase1Dataset.event,
  datasetVersion: phase1Dataset.datasetVersion,
  frozenAt: phase1Dataset.frozenAt,
  scope: phase1Dataset.scope,
};
