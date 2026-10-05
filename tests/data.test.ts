import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import kpi from "@/data/phase1/kpi_comparison_v1.json";
import { phase1Dataset, phase1Map, site } from "@/lib/data";
import { PREFECTURES } from "@/data/geo";
import { JAPAN_MAP_SHAPES } from "@/data/japan-map.generated";
import { updates } from "@/data/updates";
import { safeExternalUrl } from "@/lib/links";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { phase1SummaryOf } from "@/lib/model";

/**
 * 本番データ（Phase 1 最終データ）の検証。`npm run validate:data` でも実行できる。
 */
const raw = phase1Dataset.records;
const phase1Records = site.records.filter((r) => r.dataset === "phase1");

describe("Phase 1 ファイルの追跡可能性", () => {
  it("data/phase1 のファイルが受け取ったときから変更されていない（SHA-256）", () => {
    const dir = join(process.cwd(), "data/phase1");
    const lines = readFileSync(join(dir, "SHA256SUMS"), "utf8").trim().split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(4);
    for (const line of lines) {
      const [hash, name] = line.split(/\s+/);
      const actual = createHash("sha256").update(readFileSync(join(dir, name))).digest("hex");
      expect(actual, name).toBe(hash);
    }
  });
  it("全レコードを削除・追加せずに取り込み、ID を維持する", () => {
    expect(phase1Records.map((r) => r.id)).toEqual(raw.map((r) => r.id));
    expect(new Set(site.records.map((r) => r.id)).size).toBe(site.records.length);
  });
  it("差分更新は空（v1 時点）", () => {
    expect(updates).toEqual([]);
  });
});

describe("47都道府県と地図状態", () => {
  it("地図データに47都道府県があり重複がない", () => {
    expect(phase1Map.prefectures).toHaveLength(47);
    expect(new Set(phase1Map.prefectures.map((p) => p.prefecture)).size).toBe(47);
    expect(new Set(phase1Map.prefectures.map((p) => p.prefectureCode)).size).toBe(47);
    expect(site.prefectures.map((p) => p.name)).toEqual(PREFECTURES.map((p) => p.name));
  });
  it("サイトの状態が地図データの status と一致する", () => {
    for (const m of phase1Map.prefectures) {
      const v = site.prefectures.find((p) => p.name === m.prefecture)!;
      expect(v.status, m.prefecture).toBe(m.status);
    }
  });
  it("状態別の県数が Phase 1 成果物と一致する", () => {
    const fromMap = { confirmed: 0, candidate: 0, searched_no_evidence: 0 } as Record<string, number>;
    for (const m of phase1Map.prefectures) fromMap[m.status]++;
    expect(site.stats.statusCounts).toEqual(fromMap);
    expect(site.stats.statusCounts.confirmed).toBe(kpi.end.prefecturesWithConfirmed);
    expect(site.stats.statusCounts.searched_no_evidence).toBe(kpi.end.searchedNoEvidencePrefectures);
    expect(site.stats.prefecturesWithData).toBe(kpi.end.prefecturesWithDivisionCandidates);
  });
  it("県別集計が地図データと一致する", () => {
    for (const m of phase1Map.prefectures) {
      const s = site.prefectures.find((p) => p.name === m.prefecture)!.summary;
      expect(s.recordCount, m.prefecture).toBe(m.recordCount);
      expect(s.categoryNameCount, m.prefecture).toBe(m.divisionCount);
      expect(s.listingAreaCount, m.prefecture).toBe(m.listingAreaCount);
      expect(s.storeCount, m.prefecture).toBe(m.storeCount);
      expect(s.entrantCount, m.prefecture).toBe(m.entrantCount);
      expect(s.byConfidence, m.prefecture).toEqual({
        confirmed: m.confirmedCount,
        probable: m.probableCount,
        unverified: m.unverifiedCount,
      });
    }
  });
  it("地図の形状データに47都道府県がある", () => {
    expect(JAPAN_MAP_SHAPES.map((s) => s.code).sort()).toEqual(
      PREFECTURES.map((p) => String(p.code).padStart(2, "0")),
    );
    for (const s of JAPAN_MAP_SHAPES) expect(s.d.startsWith("M"), s.code).toBe(true);
  });
});

describe("全国集計", () => {
  it("Phase 1 の summary・KPI と一致する", () => {
    const derived = phase1SummaryOf(phase1Records);
    for (const [k, v] of Object.entries(derived)) {
      expect(v, k).toBe(phase1Dataset.summary[k]);
      expect(v, k).toBe((kpi.end as Record<string, number>)[k]);
    }
    expect(site.stats.recordCount).toBe(kpi.end.recordCount);
    expect(site.stats.categoryNameCount).toBe(kpi.end.uniqueCategoryOriginalCount);
  });
  it("県別合計＋地域未判明＝全観測", () => {
    const sum = site.prefectures.reduce((n, p) => n + p.recordCount, 0);
    expect(sum + site.stats.unknownPrefectureRecordCount).toBe(site.stats.recordCount);
    expect(site.stats.unknownPrefectureRecordCount).toBe(phase1Map.unassignedRecordCount);
    expect(site.stats.unknownPrefectureRecordCount).toBe(kpi.end.prefectureUnknown);
  });
});

describe("原文・地域の保持", () => {
  it("categoryOriginal を原文のまま保持する", () => {
    raw.forEach((r, i) => expect(phase1Records[i].categoryOriginal).toBe(r.categoryOriginal));
    expect(new Set(site.records.map((r) => r.categoryOriginal)).size).toBe(phase1Dataset.summary.uniqueCategoryOriginalCount);
  });
  it("listingArea を保持し、formalElectionArea を補完しない", () => {
    raw.forEach((r, i) => {
      expect(phase1Records[i].listingArea ?? null).toBe(r.listingArea ?? null);
      expect(phase1Records[i].formalElectionArea ?? null).toBe(r.formalElectionArea ?? null);
    });
    expect(site.records.filter((r) => r.formalElectionArea)).toHaveLength(phase1Dataset.summary.formalElectionConnections);
  });
  it("都道府県未判明のレコードを削除せず、地名から県を推定しない", () => {
    const unknown = raw.filter((r) => !r.prefecture);
    expect(site.unknownPrefecture!.recordCount).toBe(unknown.length);
    for (const r of unknown) expect(site.records.find((x) => x.id === r.id)!.prefecture).toBeUndefined();
  });
  it("部分データ（店舗・出場者・掲載地域が未判明）も保持する", () => {
    expect(site.records.some((r) => !r.storeName)).toBe(true);
    expect(site.records.some((r) => r.entrantNames.length === 0)).toBe(true);
    expect(site.records.some((r) => !r.listingArea && r.prefecture)).toBe(true);
  });
});

describe("外部URL", () => {
  it("すべて安全な http(s) URL", () => {
    for (const r of site.records) {
      for (const u of [r.sourceUrl, r.regionSourceUrl, r.entrantUrl, r.storeUrl]) {
        if (u) expect(safeExternalUrl(u), r.id).not.toBeNull();
      }
    }
  });
});

describe("実データでの検索", () => {
  const items = buildSearchIndex(site);
  it("全部門・全店舗が検索インデックスにある", () => {
    expect(items.filter((i) => i.kind === "division")).toHaveLength(site.divisions.length);
    expect(items.filter((i) => i.kind === "store")).toHaveLength(site.stores.length);
  });
  it("categoryNormalized で検索補助しつつ、表示は原文", () => {
    const withNorm = site.records.find((r) => r.categoryNormalized && r.categoryNormalized !== r.categoryOriginal);
    if (!withNorm) return;
    const hits = searchItems(items, { q: withNorm.categoryNormalized, kind: "division" }).map((h) => h.item.name);
    expect(hits).toContain(withNorm.categoryOriginal);
  });
  it("地域未判明の観測も検索できる", () => {
    const u = site.unknownPrefecture!.divisions[0];
    const hits = searchItems(items, { q: u.categoryOriginal, pref: "unknown" }).map((h) => h.item.id);
    expect(hits).toContain(u.id);
  });
});

describe("遷移先の整合", () => {
  it("出場者のリンク先に該当する観測・出場者がある", async () => {
    const { entrantHref, findDivision, findStore } = await import("@/lib/model");
    for (const e of site.entrants) {
      const [path, frag] = entrantHref(e).split("#");
      const [, kind, id] = path.split("/");
      if (kind === "store") {
        expect(findStore(site, id), e.name).not.toBeNull();
        expect(frag).toBe(e.id);
      } else {
        const d = findDivision(site, id)!;
        expect(d.records.map((r) => r.id), e.name).toContain(frag);
      }
    }
  });
});

describe("誤解を招く表現をしない", () => {
  it("「情報なし」の県を不存在として表現しない", async () => {
    const { MAP_STATUS_LABEL, MAP_STATUS_DESCRIPTION } = await import("@/lib/labels");
    expect(MAP_STATUS_LABEL.searched_no_evidence).not.toMatch(/存在しない|いない|ない県/);
    expect(MAP_STATUS_DESCRIPTION.searched_no_evidence).toContain("意味ではありません");
  });
});
