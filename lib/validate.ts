import type { Dataset, MapStatus, Phase1Dataset, Phase1Map, Phase1RawRecord } from "@/data/types";
import { PREFECTURES, findPrefectureByName } from "@/data/geo";
import { safeExternalUrl } from "./links";
import { adaptAll } from "./phase1";
import { derivePrefectureCounts, deriveStatus, phase1SummaryOf } from "./model";

export interface ValidationIssue {
  level: "error" | "warning";
  id: string;
  dataset: Dataset | "map" | "summary";
  message: string;
}

const CONFIDENCES = ["confirmed", "probable", "unverified"];
const SOURCE_TYPES = ["official", "store", "entrant_diary", "entrant_social", "other"];
const MAP_STATUSES: MapStatus[] = ["confirmed", "candidate", "searched_no_evidence"];
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

const NULLABLE_TEXT = [
  "prefecture",
  "area",
  "listingArea",
  "formalElectionArea",
  "categoryNormalized",
  "storeName",
  "entrantName",
  "notes",
  "storePrefecture",
  "storeCity",
] as const;
const URL_FIELDS = ["entrantUrl", "storeUrl", "sourceUrl", "regionSourceUrl"] as const;

function isValidDate(s: string): boolean {
  if (!DATE_PATTERN.test(s)) return false;
  const day = s.slice(0, 10);
  const d = new Date(`${day}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === day;
}

/**
 * レコードを検証する。error が1件でもあれば公開してはいけない（lib/data.ts がビルドを止める）。
 */
export function validateRecords(sets: Record<Dataset, readonly Phase1RawRecord[]>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, Dataset>();

  for (const dataset of Object.keys(sets) as Dataset[]) {
    for (const r of sets[dataset]) {
      const id = typeof r?.id === "string" ? r.id : "(idなし)";
      const err = (message: string) => issues.push({ level: "error", id, dataset, message });
      const warn = (message: string) => issues.push({ level: "warning", id, dataset, message });

      if (typeof r !== "object" || r === null) {
        err("レコードがオブジェクトではありません");
        continue;
      }
      if (typeof r.id !== "string" || !ID_PATTERN.test(r.id)) {
        err("id は英数字・ハイフン・アンダースコアのみで指定してください");
      } else if (seen.has(r.id)) {
        err(`id が重複しています（${seen.get(r.id)} と ${dataset}）`);
      } else {
        seen.set(r.id, dataset);
      }

      if (!CONFIDENCES.includes(r.confidence)) err(`confidence が不正です: ${String(r.confidence)}`);
      for (const f of ["categoryConfidence", "regionConfidence"] as const) {
        const v = r[f];
        if (v !== undefined && v !== null && !CONFIDENCES.includes(v)) err(`${f} が不正です: ${String(v)}`);
      }
      if (!SOURCE_TYPES.includes(r.sourceType)) err(`sourceType が不正です: ${String(r.sourceType)}`);
      if (r.regionSourceType != null && !SOURCE_TYPES.includes(r.regionSourceType)) {
        err(`regionSourceType が不正です: ${String(r.regionSourceType)}`);
      }

      if (typeof r.categoryOriginal !== "string" || r.categoryOriginal.trim() === "") {
        err("categoryOriginal（部門名の原文）は必須です");
      }

      for (const f of NULLABLE_TEXT) {
        const v = r[f];
        if (v === undefined || v === null) continue;
        if (typeof v !== "string" || v.trim() === "") {
          err(`${f} が空です。不明な場合は null にしてください`);
        }
      }

      if (r.entrantNames !== undefined && r.entrantNames !== null) {
        if (!Array.isArray(r.entrantNames) || r.entrantNames.some((n) => typeof n !== "string" || n.trim() === "")) {
          err("entrantNames は空でない文字列の配列にしてください");
        }
      }

      for (const f of URL_FIELDS) {
        const v = r[f];
        if (v === undefined || v === null) continue;
        if (!safeExternalUrl(v)) err(`${f} は http(s) の正しいURLにしてください`);
      }

      if (r.checkedAt != null && (typeof r.checkedAt !== "string" || !isValidDate(r.checkedAt))) {
        err("checkedAt は YYYY-MM-DD または ISO 8601 日時にしてください");
      }

      if (r.prefecture != null && !findPrefectureByName(r.prefecture)) {
        err(`prefecture は正式な都道府県名（例: 神奈川県）か null にしてください: ${r.prefecture}`);
      }

      if (r.area != null && r.listingArea != null && r.area !== r.listingArea) {
        err("area（互換用）と listingArea が一致しません");
      }

      if (r.confidence === "confirmed" && !r.sourceUrl) {
        err("confirmed には sourceUrl（確認元）が必須です");
      }

      if (r.listingArea && !r.prefecture) {
        warn("掲載地域はありますが都道府県が未判明です（地名から都道府県を推定しないこと）");
      }
    }
  }
  return issues;
}

/**
 * map_47prefectures_v1.json を、Phase 1 レコードから再集計した値と照合する。
 * （地図の状態・件数を手で書き換えた／データと食い違った場合にビルドを止める）
 */
export function validateMap(map: Phase1Map, phase1Records: readonly Phase1RawRecord[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (id: string, message: string) => issues.push({ level: "error", id, dataset: "map", message });
  const list = Array.isArray(map?.prefectures) ? map.prefectures : [];

  if (list.length !== PREFECTURES.length) err("prefectures", `都道府県数が ${list.length} です（47 必要）`);
  const names = new Set<string>();
  const codes = new Set<string>();
  for (const p of list) {
    if (names.has(p.prefecture)) err(p.prefecture, "都道府県が重複しています");
    if (codes.has(p.prefectureCode)) err(p.prefecture, `県コードが重複しています: ${p.prefectureCode}`);
    names.add(p.prefecture);
    codes.add(p.prefectureCode);
    const master = findPrefectureByName(p.prefecture);
    if (!master) {
      err(p.prefecture, "都道府県名が不正です");
      continue;
    }
    if (p.prefectureCode !== String(master.code).padStart(2, "0")) {
      err(p.prefecture, `県コードが JIS と一致しません: ${p.prefectureCode}`);
    }
    if (!MAP_STATUSES.includes(p.status as MapStatus)) err(p.prefecture, `status が不正です: ${p.status}`);
  }
  for (const m of PREFECTURES) if (!names.has(m.name)) err(m.name, "地図データに都道府県がありません");

  const records = adaptAll({ phase1: phase1Records, update: [] });
  for (const p of list) {
    const inPref = records.filter((r) => r.prefecture === p.prefecture);
    const c = derivePrefectureCounts(inPref);
    const expected: Record<string, unknown> = {
      status: deriveStatus(inPref),
      recordCount: c.recordCount,
      divisionCount: c.categoryNameCount,
      confirmedCount: c.byConfidence.confirmed,
      probableCount: c.byConfidence.probable,
      unverifiedCount: c.byConfidence.unverified,
      listingAreaCount: c.listingAreaCount,
      storeCount: c.storeCount,
      entrantCount: c.entrantCount,
      unknownListingAreaRecordCount: c.unknownListingAreaRecordCount,
      listingAreas: JSON.stringify([...c.listingAreas].sort()),
    };
    const actual: Record<string, unknown> = {
      ...p,
      listingAreas: JSON.stringify([...(p.listingAreas ?? [])].sort()),
    };
    for (const [k, v] of Object.entries(expected)) {
      if (actual[k] !== v) err(p.prefecture, `${k} がレコードからの集計と一致しません（地図: ${String(actual[k])} / 集計: ${String(v)}）`);
    }
  }
  const unassigned = records.filter((r) => !r.prefecture).length;
  if (map.unassignedRecordCount !== unassigned) {
    err("unassignedRecordCount", `県未判明件数が一致しません（地図: ${map.unassignedRecordCount} / 集計: ${unassigned}）`);
  }
  return issues;
}

/** nationwide_dataset_v1.json の summary を、レコードから再集計した値と照合する */
export function validateDatasetSummary(dataset: Phase1Dataset): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const records = adaptAll({ phase1: dataset.records, update: [] });
  const derived = phase1SummaryOf(records);
  for (const [k, v] of Object.entries(derived)) {
    if (dataset.summary?.[k] !== v) {
      issues.push({
        level: "error",
        id: k,
        dataset: "summary",
        message: `summary.${k} がレコードからの集計と一致しません（summary: ${String(dataset.summary?.[k])} / 集計: ${v}）`,
      });
    }
  }
  return issues;
}
