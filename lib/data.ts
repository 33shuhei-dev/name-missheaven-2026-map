import { candidates } from "@/data/candidates";
import { verified } from "@/data/verified";
import { buildModel, toRecords, type SiteModel } from "./model";
import { validateDatasets } from "./validate";

/**
 * サイト全体が参照するデータの唯一の入口。
 * data/verified.ts と data/candidates.ts を読み込み、検証してから画面用の構造を作る。
 * データに error があればビルド（静的生成）を失敗させ、壊れたデータを公開しない。
 */
function load(): SiteModel {
  const sets = { verified, candidate: candidates };
  const errors = validateDatasets(sets).filter((i) => i.level === "error");
  if (errors.length > 0) {
    const detail = errors.map((e) => `[${e.dataset}] ${e.id}: ${e.message}`).join("\n");
    throw new Error(`データ検証エラーがあります:\n${detail}`);
  }
  return buildModel(toRecords(sets));
}

export const site: SiteModel = load();
