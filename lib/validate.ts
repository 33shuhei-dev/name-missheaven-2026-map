import type { Confidence, Dataset, Entry, SourceType } from "@/data/types";
import { findPrefectureByName } from "@/data/geo";
import { safeExternalUrl } from "./links";

export interface ValidationIssue {
  level: "error" | "warning";
  id: string;
  dataset: Dataset;
  message: string;
}

const CONFIDENCES: readonly Confidence[] = ["confirmed", "probable", "unverified"];
const SOURCE_TYPES: readonly SourceType[] = [
  "official",
  "store",
  "entrant_diary",
  "entrant_social",
  "other",
];
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const TEXT_FIELDS = [
  "prefecture",
  "area",
  "categoryOriginal",
  "categoryNormalized",
  "entrantName",
  "storeName",
  "notes",
] as const;
const URL_FIELDS = ["entrantUrl", "storeUrl", "sourceUrl"] as const;

function isValidDate(s: string): boolean {
  if (!DATE_PATTERN.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/**
 * データセットを検証する。error が1件でもあれば、そのデータは公開してはいけない。
 * （lib/repository.ts は error があるとビルド時に例外を投げる）
 */
export function validateDatasets(sets: Record<Dataset, readonly Entry[]>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, Dataset>();

  for (const dataset of Object.keys(sets) as Dataset[]) {
    for (const e of sets[dataset]) {
      const id = typeof e.id === "string" ? e.id : "(idなし)";
      const err = (message: string) => issues.push({ level: "error", id, dataset, message });
      const warn = (message: string) => issues.push({ level: "warning", id, dataset, message });

      if (typeof e.id !== "string" || !ID_PATTERN.test(e.id)) {
        err("id は英数字・ハイフン・アンダースコアのみで指定してください");
      } else if (seen.has(e.id)) {
        err(`id が重複しています（${seen.get(e.id)} と ${dataset}）`);
      } else {
        seen.set(e.id, dataset);
      }

      if (!CONFIDENCES.includes(e.confidence)) err(`confidence が不正です: ${String(e.confidence)}`);
      if (!SOURCE_TYPES.includes(e.sourceType)) err(`sourceType が不正です: ${String(e.sourceType)}`);

      for (const f of TEXT_FIELDS) {
        const v = e[f];
        if (v === undefined) continue;
        if (typeof v !== "string" || v.trim() === "") {
          err(`${f} が空です。不明な場合は項目ごと省略してください`);
        } else if (v !== v.trim()) {
          err(`${f} の前後に空白があります`);
        }
      }

      for (const f of URL_FIELDS) {
        const v = e[f];
        if (v === undefined) continue;
        if (!safeExternalUrl(v)) err(`${f} は http(s) の正しいURLにしてください`);
      }

      if (e.checkedAt !== undefined && !isValidDate(e.checkedAt)) {
        err("checkedAt は YYYY-MM-DD 形式の実在する日付にしてください");
      }

      if (e.prefecture !== undefined && !findPrefectureByName(e.prefecture)) {
        err(`prefecture は正式な都道府県名（例: 神奈川県）にしてください: ${e.prefecture}`);
      }

      if (!e.prefecture && !e.area && !e.categoryOriginal && !e.entrantName && !e.storeName) {
        err("都道府県・エリア・部門・出場者・店舗のいずれも未入力です");
      }

      if (e.categoryNormalized !== undefined && !e.categoryOriginal) {
        err("categoryNormalized は categoryOriginal がある場合のみ設定できます");
      }

      if (e.area && !e.prefecture) warn("エリアがありますが都道府県が未入力です");

      // 確認状態のルール
      if (e.confidence === "confirmed" && !e.sourceUrl) {
        err("confirmed には sourceUrl（確認元）が必須です");
      }
      if (dataset === "candidate" && e.confidence === "confirmed") {
        err("調査候補（candidates）に confirmed は設定できません。確認後に verified へ移してください");
      }
      if (dataset === "verified") {
        if (!e.sourceUrl) err("verified には sourceUrl（確認元）が必須です");
        if (e.confidence === "unverified") {
          err("verified に unverified は設定できません。未確認なら candidates に登録してください");
        }
        if (!e.checkedAt) err("verified には checkedAt（確認日）が必須です");
      }
    }
  }

  return issues;
}
