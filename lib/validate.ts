import type {
  Confidence,
  Dataset,
  EntrantRawRecord,
  MapStatus,
  Phase1Dataset,
  Phase1Map,
  Phase1RawRecord,
  Phase3CampaignStore,
  Phase3Coverage,
  Phase3RawRelation,
  Phase3RawSource,
  Phase3RawStore,
  Phase3StoresFile,
} from "@/data/types";
import { PREFECTURES, findPrefectureByName } from "@/data/geo";
import { safeExternalUrl } from "./links";
import { adaptAll } from "./phase1";
import { derivePrefectureCounts, deriveStatus, phase1SummaryOf } from "./model";

export interface ValidationIssue {
  level: "error" | "warning";
  id: string;
  dataset: Dataset | "map" | "summary" | "phase3";
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

/* ───────────── Phase 3（参加店舗）の検証 ───────────── */

export interface Phase3Input {
  storesFile: Phase3StoresFile;
  relations: readonly Phase3RawRelation[];
  sources: readonly Phase3RawSource[];
  campaignStores: readonly Phase3CampaignStore[];
  coverage: Phase3Coverage;
  confirmedStores: readonly Phase3RawStore[];
}

/**
 * Phase 3 の店舗・関係・情報源を検証し、Phase 1 レコードとの参照、
 * summary・47都道府県カバレッジとの整合を確認する。
 */
export function validatePhase3(input: Phase3Input, phase1Records: readonly Phase1RawRecord[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (id: string, message: string) => issues.push({ level: "error", id, dataset: "phase3", message });
  const stores = Array.isArray(input.storesFile?.stores) ? input.storesFile.stores : [];
  const p1ids = new Set(phase1Records.map((r) => r.id));
  const p1cats = new Set(phase1Records.map((r) => r.categoryOriginal));
  const storeIds = new Set<string>();
  const recordOwner = new Map<string, string>();

  for (const s of stores) {
    const id = typeof s?.storeId === "string" ? s.storeId : "(storeIdなし)";
    if (typeof s.storeId !== "string" || !ID_PATTERN.test(s.storeId)) err(id, "storeId が不正です");
    else if (storeIds.has(s.storeId)) err(id, "storeId が重複しています");
    storeIds.add(s.storeId);
    if (typeof s.storeName !== "string" || !s.storeName.trim()) err(id, "storeName は必須です");
    if (!Array.isArray(s.storeNameOriginals) || !s.storeNameOriginals.includes(s.storeName)) {
      err(id, "storeNameOriginals に storeName が含まれていません");
    }
    if (!CONFIDENCES.includes(s.confidence)) err(id, `confidence が不正です: ${String(s.confidence)}`);
    if (!SOURCE_TYPES.includes(s.sourceType)) err(id, `sourceType が不正です: ${String(s.sourceType)}`);
    if (s.prefecture != null && !findPrefectureByName(s.prefecture)) err(id, `prefecture が不正です: ${s.prefecture}`);
    if (!Array.isArray(s.listingAreas) || s.listingAreas.some((a) => typeof a !== "string" || !a.trim())) {
      err(id, "listingAreas は空でない文字列の配列にしてください");
    } else if (s.listingArea != null && !s.listingAreas.includes(s.listingArea)) {
      err(id, "listingArea が listingAreas に含まれていません");
    } else if (s.listingArea == null && s.listingAreas.length === 1) {
      err(id, "listingAreas が1件なのに listingArea が null です");
    }
    for (const f of ["storePublicUrl", "participationEvidenceUrl"] as const) {
      const v = s[f];
      if (v != null && !safeExternalUrl(v)) err(id, `${f} は http(s) の正しいURLにしてください`);
    }
    if (s.confidence === "confirmed" && !s.participationEvidenceUrl) err(id, "confirmed には参加根拠URLが必須です");
    for (const rid of s.phase1RecordIds ?? []) {
      if (!p1ids.has(rid)) err(id, `phase1RecordIds に存在しない観測IDがあります: ${rid}`);
      else if (recordOwner.has(rid)) err(id, `観測 ${rid} が複数の店舗に接続されています`);
      else recordOwner.set(rid, s.storeId);
    }
  }

  // 店舗名のある Phase 1 観測は、必ずいずれかの店舗に接続されていること（既存の店舗・人物表示を失わない）
  for (const r of phase1Records) {
    if (r.storeName && !recordOwner.has(r.id)) err(r.id, "店舗名のある Phase 1 観測が Phase 3 の店舗に接続されていません");
  }

  const relIds = new Set<string>();
  const relPairs = new Set<string>();
  for (const rel of input.relations) {
    const id = rel?.relationId ?? "(relationIdなし)";
    if (relIds.has(id)) err(id, "relationId が重複しています");
    relIds.add(id);
    if (!storeIds.has(rel.storeId)) err(id, `存在しない storeId を参照しています: ${rel.storeId}`);
    if (typeof rel.categoryOriginal !== "string" || !rel.categoryOriginal.trim()) err(id, "categoryOriginal は必須です");
    else if (!p1cats.has(rel.categoryOriginal)) err(id, `Phase 1 にない部門原文です: ${rel.categoryOriginal}`);
    if (!CONFIDENCES.includes(rel.confidence)) err(id, `confidence が不正です: ${String(rel.confidence)}`);
    const pair = `${rel.storeId}|${rel.categoryOriginal}`;
    if (relPairs.has(pair)) err(id, "同じ店舗×部門の関係が重複しています");
    relPairs.add(pair);
    for (const rid of rel.phase1RecordIds ?? []) if (!p1ids.has(rid)) err(id, `存在しない観測IDです: ${rid}`);
  }
  for (const s of stores) {
    const proj = [...new Set(input.relations.filter((r) => r.storeId === s.storeId).map((r) => r.categoryOriginal))].sort();
    if (JSON.stringify(proj) !== JSON.stringify([...(s.categoryOriginals ?? [])].sort())) {
      err(s.storeId, "categoryOriginals が店舗×部門関係と一致しません");
    }
  }

  const srcIds = new Set<string>();
  for (const src of input.sources) {
    if (srcIds.has(src.sourceId)) err(src.sourceId, "sourceId が重複しています");
    srcIds.add(src.sourceId);
    if (!safeExternalUrl(src.url)) err(src.sourceId, "情報源URLは http(s) の正しいURLにしてください");
    if (!SOURCE_TYPES.includes(src.sourceType)) err(src.sourceId, `sourceType が不正です: ${src.sourceType}`);
  }
  for (const s of stores) for (const sid of s.sourceIds ?? []) if (!srcIds.has(sid)) err(s.storeId, `存在しない sourceId: ${sid}`);

  // 応援キャンペーンのみの店舗は参加店舗に混ぜない
  for (const c of input.campaignStores) {
    if (storeIds.has(c.storeId) || stores.some((s) => s.storeName === c.storeName && s.prefecture === c.prefecture)) {
      err(c.storeId, "応援キャンペーンのみの店舗が参加店舗一覧に含まれています");
    }
  }

  // confirmed 抽出ファイルとの一致
  const confirmedIds = stores.filter((s) => s.confidence === "confirmed").map((s) => s.storeId).sort();
  const fileIds = input.confirmedStores.map((s) => s.storeId).sort();
  if (JSON.stringify(confirmedIds) !== JSON.stringify(fileIds)) err("confirmed", "confirmed 抽出ファイルと店舗一覧の confirmed が一致しません");

  // summary との一致
  const sm = input.storesFile.summary ?? {};
  const expect: Record<string, number> = {
    finalStoresIncludingCandidates: stores.length,
    confirmedStores: stores.filter((s) => s.confidence === "confirmed").length,
    probableStores: stores.filter((s) => s.confidence === "probable").length,
    unverifiedStores: stores.filter((s) => s.confidence === "unverified").length,
    newSincePhase1: stores.filter((s) => s.isNewSincePhase1).length,
    storeCategoryRelationCount: input.relations.length,
    categoryOriginalCount: new Set(input.relations.map((r) => r.categoryOriginal)).size,
    publicUrlCount: stores.filter((s) => s.storePublicUrl).length,
    participationEvidenceUrlCount: stores.filter((s) => s.participationEvidenceUrl).length,
    unknownPrefectureStoreCount: stores.filter((s) => !s.prefecture).length,
    prefecturesWithStores: new Set(stores.map((s) => s.prefecture).filter(Boolean)).size,
    prefecturesWithConfirmedStores: new Set(stores.filter((s) => s.confidence === "confirmed").map((s) => s.prefecture).filter(Boolean)).size,
    listingAreaConnections: new Set(stores.flatMap((s) => s.listingAreas.map((a) => `${s.prefecture ?? ""}|${a}`))).size,
    campaignSupportOnlyExcluded: input.campaignStores.length,
  };
  for (const [k, v] of Object.entries(expect)) {
    if (sm[k] !== v) err(`summary.${k}`, `Phase 3 summary.${k} が集計と一致しません（summary: ${String(sm[k])} / 集計: ${v}）`);
  }

  // 47都道府県カバレッジとの一致（状態は Phase 1 観測＋Phase 3 店舗から導出）
  const cov = Array.isArray(input.coverage?.prefectures) ? input.coverage.prefectures : [];
  if (cov.length !== PREFECTURES.length) err("coverage", `カバレッジの都道府県数が ${cov.length} です（47 必要）`);
  const adaptedRecords = adaptAll({ phase1: phase1Records, update: [] });
  for (const c of cov) {
    const master = findPrefectureByName(c.prefecture);
    if (!master) {
      err(c.prefecture, "カバレッジの都道府県名が不正です");
      continue;
    }
    if (c.prefectureCode !== String(master.code).padStart(2, "0")) err(c.prefecture, "カバレッジの県コードが JIS と一致しません");
    const ps = stores.filter((s) => s.prefecture === c.prefecture);
    const status = deriveStatus(
      adaptedRecords.filter((r) => r.prefecture === c.prefecture),
      ps.map((s) => ({ confidence: s.confidence as Confidence })),
    );
    const exp: Record<string, unknown> = {
      status,
      storeCount: ps.length,
      confirmedCount: ps.filter((s) => s.confidence === "confirmed").length,
      probableCount: ps.filter((s) => s.confidence === "probable").length,
      unverifiedCount: ps.filter((s) => s.confidence === "unverified").length,
      publicUrlCount: ps.filter((s) => s.storePublicUrl).length,
    };
    for (const [k, v] of Object.entries(exp)) {
      if (c[k] !== v) err(c.prefecture, `カバレッジ ${k} が集計と一致しません（カバレッジ: ${String(c[k])} / 集計: ${String(v)}）`);
    }
  }
  if (input.coverage.unassignedStoreCount !== stores.filter((s) => !s.prefecture).length) {
    err("coverage", "カバレッジの県未判明店舗数が一致しません");
  }
  return issues;
}

/**
 * Phase 3 以降の店舗の差分更新（data/store-updates.ts）を検証する。
 * Phase 3 の summary・カバレッジとの照合は Phase 3 成果物だけを対象にするため、ここでは形式と参照整合だけを見る。
 */
export function validateStoreUpdates(
  updates: { stores: readonly Phase3RawStore[]; relations: readonly Phase3RawRelation[]; sources: readonly Phase3RawSource[] },
  phase3: { stores: readonly Phase3RawStore[]; relations: readonly Phase3RawRelation[]; sources: readonly Phase3RawSource[] },
  phase1Records: readonly Phase1RawRecord[],
  campaignStores: readonly Phase3CampaignStore[] = [],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (id: string, message: string) => issues.push({ level: "error", id, dataset: "update", message });
  const p1ids = new Set(phase1Records.map((r) => r.id));
  const storeIds = new Set(phase3.stores.map((s) => s.storeId));
  const relIds = new Set(phase3.relations.map((r) => r.relationId));
  const srcIds = new Set(phase3.sources.map((s) => s.sourceId));
  const ownedRecords = new Set(phase3.stores.flatMap((s) => s.phase1RecordIds));

  for (const src of updates.sources) {
    if (srcIds.has(src.sourceId)) err(src.sourceId, "sourceId が既存と重複しています");
    srcIds.add(src.sourceId);
    if (!safeExternalUrl(src.url)) err(src.sourceId, "情報源URLは http(s) の正しいURLにしてください");
    if (!SOURCE_TYPES.includes(src.sourceType)) err(src.sourceId, `sourceType が不正です: ${src.sourceType}`);
  }
  for (const s of updates.stores) {
    const id = s.storeId;
    if (typeof id !== "string" || !ID_PATTERN.test(id)) err(String(id), "storeId が不正です");
    else if (storeIds.has(id)) err(id, "storeId が既存の店舗と重複しています");
    storeIds.add(id);
    if (typeof s.storeName !== "string" || !s.storeName.trim()) err(id, "storeName は必須です");
    if (!Array.isArray(s.storeNameOriginals) || !s.storeNameOriginals.includes(s.storeName)) {
      err(id, "storeNameOriginals に storeName が含まれていません");
    }
    if (phase3.stores.some((x) => x.prefecture === s.prefecture && (x.storeName === s.storeName || x.storeNameOriginals.includes(s.storeName)))) {
      err(id, "同じ県・同じ店名の店舗が Phase 3 にあります（重複追加しないでください）");
    }
    if (campaignStores.some((c) => c.storeName === s.storeName && c.prefecture === s.prefecture)) {
      err(id, "応援キャンペーンのみの店舗を参加店舗として追加しようとしています");
    }
    if (!CONFIDENCES.includes(s.confidence)) err(id, `confidence が不正です: ${String(s.confidence)}`);
    if (!SOURCE_TYPES.includes(s.sourceType)) err(id, `sourceType が不正です: ${String(s.sourceType)}`);
    if (s.prefecture != null && !findPrefectureByName(s.prefecture)) err(id, `prefecture が不正です: ${s.prefecture}`);
    if (!Array.isArray(s.listingAreas) || s.listingAreas.some((a) => typeof a !== "string" || !a.trim())) {
      err(id, "listingAreas は空でない文字列の配列にしてください");
    } else if (s.listingArea != null && !s.listingAreas.includes(s.listingArea)) {
      err(id, "listingArea が listingAreas に含まれていません");
    }
    for (const f of ["storePublicUrl", "participationEvidenceUrl"] as const) {
      const v = s[f];
      if (v != null && !safeExternalUrl(v)) err(id, `${f} は http(s) の正しいURLにしてください`);
    }
    if (!s.participationEvidenceUrl) err(id, "追加する店舗には参加根拠URLが必須です");
    if (s.isNewSincePhase1 !== true) err(id, "差分更新の店舗は isNewSincePhase1: true にしてください");
    for (const rid of s.phase1RecordIds ?? []) {
      if (!p1ids.has(rid)) err(id, `存在しない観測IDです: ${rid}`);
      else if (ownedRecords.has(rid)) err(id, `観測 ${rid} はすでに別の店舗に接続されています`);
    }
    for (const sid of s.sourceIds ?? []) if (!srcIds.has(sid)) err(id, `存在しない sourceId: ${sid}`);
  }
  for (const rel of updates.relations) {
    const id = rel.relationId;
    if (relIds.has(id)) err(id, "relationId が既存と重複しています");
    relIds.add(id);
    if (!updates.stores.some((s) => s.storeId === rel.storeId)) err(id, "差分更新の関係は差分更新の店舗を参照してください");
    if (typeof rel.categoryOriginal !== "string" || !rel.categoryOriginal.trim()) err(id, "categoryOriginal は必須です");
    if (!CONFIDENCES.includes(rel.confidence)) err(id, `confidence が不正です: ${String(rel.confidence)}`);
  }
  for (const s of updates.stores) {
    const proj = [...new Set(updates.relations.filter((r) => r.storeId === s.storeId).map((r) => r.categoryOriginal))].sort();
    if (JSON.stringify(proj) !== JSON.stringify([...(s.categoryOriginals ?? [])].sort())) {
      err(s.storeId, "categoryOriginals が店舗×部門関係と一致しません");
    }
  }
  return issues;
}

/**
 * 出場者の記録（data/entrant-updates.ts）の検証。
 * 必須：人物名・所属店舗（存在する storeId）・2026年の出場を示す根拠（情報源と記載内容）。
 * 任意：部門（その店舗の部門に限る）・個人のページURL。
 */
export function validateEntrantRecords(
  entrants: readonly EntrantRawRecord[],
  layer: { stores: readonly Phase3RawStore[]; relations: readonly Phase3RawRelation[]; sources: readonly Phase3RawSource[] },
  entrantSources: readonly Phase3RawSource[] = [],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (id: string, message: string) => issues.push({ level: "error", id, dataset: "update", message });
  const storeIds = new Set(layer.stores.map((s) => s.storeId));
  const sourceIds = new Set(layer.sources.map((s) => s.sourceId));
  // 出場者の根拠の情報源（data/entrant-updates.ts の entrantSources）
  for (const src of entrantSources) {
    const id = src?.sourceId ?? "(sourceIdなし)";
    if (sourceIds.has(id)) err(id, "sourceId が既存と重複しています");
    sourceIds.add(id);
    if (!safeExternalUrl(src.url)) err(id, `url が不正です: ${String(src.url)}`);
    if (!SOURCE_TYPES.includes(src.sourceType)) err(id, `sourceType が不正です: ${String(src.sourceType)}`);
    for (const sid of src.storeIds ?? []) if (!storeIds.has(sid)) err(id, `存在しない storeId を参照しています: ${sid}`);
  }
  const entrantSourceStores = new Map(entrantSources.map((s) => [s.sourceId, new Set(s.storeIds ?? [])]));
  const ids = new Set<string>();
  const pairs = new Set<string>();
  for (const e of entrants) {
    const id = e?.entrantId ?? "(entrantIdなし)";
    if (typeof e.entrantId !== "string" || !ID_PATTERN.test(e.entrantId)) err(id, "entrantId は英数字・-・_ で指定してください");
    if (ids.has(id)) err(id, "entrantId が重複しています");
    ids.add(id);
    if (typeof e.name !== "string" || !e.name.trim()) err(id, "人物名（name）は必須です");
    if (!storeIds.has(e.storeId)) err(id, `所属店舗が見つかりません（storeId: ${String(e.storeId)}）。店舗を先に追加してください`);
    if (!Array.isArray(e.sourceIds) || e.sourceIds.length === 0) err(id, "2026年の出場を示す情報源（sourceIds）は必須です");
    for (const sid of e.sourceIds ?? []) if (!sourceIds.has(sid)) err(id, `存在しない sourceId です: ${sid}`);
    for (const sid of e.sourceIds ?? []) {
      const owners = entrantSourceStores.get(sid);
      if (owners && !owners.has(e.storeId)) err(id, `情報源 ${sid} はこの店舗の情報源として登録されていません`);
    }
    // 2026年の出場であること：evidence に「2026」があるか、なければ根拠の記載の日付（2026年）を evidenceDate に書く
    if (typeof e.evidence !== "string" || !e.evidence.trim()) err(id, "情報源に書かれていた内容（evidence）は必須です");
    else if (!/2026/.test(e.evidence.normalize("NFKC"))) {
      if (!e.evidenceDate) err(id, "evidence に「2026」がありません。2026年の記載であることが日付で分かる場合だけ evidenceDate（2026-MM-DD）を書いてください（2025年以前・在籍情報のみは記録しない）");
      else if (!/^2026-\d{2}-\d{2}$/.test(e.evidenceDate)) err(id, "evidenceDate は 2026 年の日付（2026-MM-DD）にしてください");
      else if (typeof e.checkedAt === "string" && e.evidenceDate > e.checkedAt.slice(0, 10)) err(id, "evidenceDate が確認日より後です");
    }
    if (!CONFIDENCES.includes(e.confidence)) err(id, `confidence が不正です: ${String(e.confidence)}`);
    if (typeof e.checkedAt !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(e.checkedAt)) err(id, "checkedAt（確認日）は YYYY-MM-DD で指定してください");
    if (e.categoryOriginal !== undefined && e.categoryOriginal !== null) {
      const cats = new Set(layer.relations.filter((r) => r.storeId === e.storeId).map((r) => r.categoryOriginal));
      if (!cats.has(e.categoryOriginal)) err(id, `部門「${e.categoryOriginal}」はこの店舗の部門にありません（先に店舗×部門関係を追加してください）`);
    }
    if (e.personalUrl !== undefined && e.personalUrl !== null && !safeExternalUrl(e.personalUrl)) err(id, "personalUrl が不正です");
    const pair = `${e.storeId}|${String(e.name ?? "").normalize("NFKC").replace(/\s/g, "")}`;
    if (pairs.has(pair)) err(id, "同じ店舗・同じ名前の出場者が重複しています");
    pairs.add(pair);
  }
  return issues;
}
