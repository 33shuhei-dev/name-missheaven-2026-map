import type {
  Confidence,
  Dataset,
  Phase1RawRecord,
  SiteRecord,
  SourceType,
} from "@/data/types";

/**
 * Phase 1 JSON（およびdata/updates.ts）のレコードを SiteRecord に変換するアダプター。
 *
 * - null → undefined にするだけで、文字列の内容（部門名の記号・絵文字・表記揺れ等）は一切変更しない
 * - id はそのまま維持する
 * - formalElectionArea は元データにある値だけを使い、listingArea や店舗所在地から補完しない
 * - 型・値の検証は lib/validate.ts が行う（このアダプターは検証済みデータを前提にする）
 */

const opt = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

export function adaptRecord(raw: Phase1RawRecord, dataset: Dataset): SiteRecord {
  const names = Array.isArray(raw.entrantNames)
    ? raw.entrantNames.filter((n): n is string => typeof n === "string" && n.length > 0)
    : [];
  const entrantNames = names.length > 0 ? names : raw.entrantName ? [raw.entrantName] : [];
  return {
    id: raw.id,
    dataset,
    prefecture: opt(raw.prefecture),
    listingArea: opt(raw.listingArea ?? raw.area),
    formalElectionArea: opt(raw.formalElectionArea),
    categoryOriginal: raw.categoryOriginal,
    categoryNormalized: opt(raw.categoryNormalized),
    storeName: opt(raw.storeName),
    entrantNames,
    entrantUrl: opt(raw.entrantUrl),
    storeUrl: opt(raw.storeUrl),
    sourceUrl: opt(raw.sourceUrl),
    sourceType: raw.sourceType as SourceType,
    regionSourceUrl: opt(raw.regionSourceUrl),
    regionSourceType: opt(raw.regionSourceType) as SourceType | undefined,
    confidence: raw.confidence as Confidence,
    categoryConfidence: opt(raw.categoryConfidence) as Confidence | undefined,
    regionConfidence: opt(raw.regionConfidence) as Confidence | undefined,
    checkedAt: opt(raw.checkedAt),
    notes: opt(raw.notes),
    storePrefecture: opt(raw.storePrefecture),
    storeCity: opt(raw.storeCity),
    sourceAccessStatus: opt(raw.sourceAccessStatus),
  };
}

export function adaptAll(sets: Record<Dataset, readonly Phase1RawRecord[]>): SiteRecord[] {
  return (Object.keys(sets) as Dataset[]).flatMap((dataset) =>
    sets[dataset].map((r) => adaptRecord(r, dataset)),
  );
}

/** "2026-10-05T02:20:25+00:00" / "2026-10-05" → "2026-10-05"（表示・比較用） */
export function dateOnly(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return m ? m[1] : undefined;
}
