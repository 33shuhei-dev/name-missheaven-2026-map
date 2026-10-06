import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import kpi from "@/data/phase1/kpi_comparison_v1.json";
import { campaignSupportStores, phase1Dataset, phase1Map, phase3b, phase3Coverage, phase3Relations, phase3Stores, site } from "@/lib/data";
import type { StoreLayer } from "@/data/types";

/** サイトの店舗レイヤーから、指定した出どころの店舗だけを取り出す */
function siteLayerOf(origin: "phase3" | "phase3b" | "update"): StoreLayer {
  const stores = site.stores.filter((s) => s.origin === origin);
  const ids = new Set(stores.map((s) => s.id));
  return {
    stores,
    relations: site.stores
      .filter((s) => ids.has(s.id))
      .flatMap((s) => s.categories.map((c) => ({ id: c.relationId, storeId: s.id, categoryOriginal: c.categoryOriginal, confidence: c.confidence, sourceIds: [], phase1RecordIds: [] }))),
    sources: [],
    countFacts: [],
  };
}
import { PREFECTURES } from "@/data/geo";
import { JAPAN_MAP_SHAPES } from "@/data/japan-map.generated";
import { updates } from "@/data/updates";
import { safeExternalUrl } from "@/lib/links";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { buildModel, findStore, phase1SummaryOf, prefSlugOf, storeIdOf, summarizeStores } from "@/lib/model";
import { relationUpdates, storeUpdates } from "@/data/store-updates";
import { entrantRelations, entrantUpdates } from "@/data/entrant-updates";

/**
 * 本番データ（Phase 1 最終データ）の検証。`npm run validate:data` でも実行できる。
 */
const raw = phase1Dataset.records;
const phase1Records = site.records.filter((r) => r.dataset === "phase1");

describe("Phase 1 ファイルの追跡可能性", () => {
  it.each(["phase1", "phase2", "phase3"])("data/%s のファイルが受け取ったときから変更されていない（SHA-256）", (phase) => {
    const dir = join(process.cwd(), "data", phase);
    const lines = readFileSync(join(dir, "SHA256SUMS"), "utf8").trim().split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(4);
    for (const line of lines) {
      const [hash, name] = line.split(/\s+/);
      const actual = createHash("sha256").update(readFileSync(join(dir, name))).digest("hex");
      expect(actual, name).toBe(hash);
    }
  });
  it("Phase 3 が入力として記録した Phase 1・2 のハッシュと一致する", () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), "data/phase3/baseline_manifest.json"), "utf8"));
    const local: Record<string, string> = {
      "nationwide_dataset_v1.json": "data/phase1/nationwide_dataset_v1.json",
      "map_47prefectures_v1.json": "data/phase1/map_47prefectures_v1.json",
      "participation_structure_2026.json": "data/phase2/participation_structure_2026.json",
    };
    for (const f of manifest.baselineFiles as { path: string; sha256: string }[]) {
      const name = f.path.split("/").pop()!;
      const actual = createHash("sha256").update(readFileSync(join(process.cwd(), local[name]))).digest("hex");
      expect(actual, name).toBe(f.sha256);
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
  it("Phase 1 ＋ Phase 3 だけで導出した状態が Phase 3 カバレッジの status と一致する", () => {
    const p3only = buildModel(phase1Records, { layer: { ...siteLayerOf("phase3") } });
    for (const c of phase3Coverage.prefectures) {
      expect(p3only.prefectures.find((p) => p.name === c.prefecture)!.status, c.prefecture).toBe(c.status);
    }
  });
  it("サイトの状態は全レイヤー（Phase 1・3・3b・個別追加）から導出され、確認済みの県は Phase 3 と同じ", () => {
    for (const c of phase3Coverage.prefectures) {
      const v = site.prefectures.find((p) => p.name === c.prefecture)!;
      if (c.status === "confirmed") expect(v.status, c.prefecture).toBe("confirmed");
      if (c.status === "candidate") expect(v.status, c.prefecture).not.toBe("searched_no_evidence");
    }
  });
  it("Phase 1 だけで導出した状態は Phase 1 地図データと一致する（Phase 1 を壊していない）", () => {
    const p1only = buildModel(phase1Records);
    for (const m of phase1Map.prefectures) {
      expect(p1only.prefectures.find((p) => p.name === m.prefecture)!.status, m.prefecture).toBe(m.status);
    }
    expect(p1only.stats.statusCounts.confirmed).toBe(kpi.end.prefecturesWithConfirmed);
    expect(p1only.stats.statusCounts.searched_no_evidence).toBe(kpi.end.searchedNoEvidencePrefectures);
  });
  it("状態別の県数（Phase 1 ＋ Phase 3）が Phase 3 カバレッジと一致する", () => {
    const fromCov = { confirmed: 0, candidate: 0, searched_no_evidence: 0 } as Record<string, number>;
    for (const c of phase3Coverage.prefectures) fromCov[c.status]++;
    expect(buildModel(phase1Records, { layer: siteLayerOf("phase3") }).stats.statusCounts).toEqual(fromCov);
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

describe("Phase 3 店舗の統合", () => {
  const sm = phase3Stores.summary as Record<string, number>;
  // Phase 3 の成果物どおりの姿（後から補った公開URL・出場者の根拠からの店舗×部門関係を除く）と summary を照合する
  const rawP3 = new Map(phase3Stores.stores.map((s) => [s.storeId, s]));
  const p3RelIds = new Set(phase3Relations.map((r) => r.relationId));
  const p3 = site.stores
    .filter((s) => s.origin === "phase3")
    .map((s) => ({
      ...s,
      storePublicUrl: rawP3.get(s.id)!.storePublicUrl ?? undefined,
      categories: s.categories.filter((c) => p3RelIds.has(c.relationId)),
      categoryOriginals: [...rawP3.get(s.id)!.categoryOriginals],
    }));
  it("Phase 3 由来の店舗数・確認状態・公開URL・関係数が Phase 3 summary と一致する", () => {
    const st = summarizeStores(p3);
    expect(st.storeCount).toBe(sm.finalStoresIncludingCandidates);
    expect(st.byConfidence).toEqual({ confirmed: sm.confirmedStores, probable: sm.probableStores, unverified: sm.unverifiedStores });
    expect(st.publicUrlCount).toBe(sm.publicUrlCount);
    expect(st.newSincePhase1).toBe(sm.newSincePhase1);
    expect(p3.reduce((n, s) => n + s.categories.length, 0)).toBe(sm.storeCategoryRelationCount);
    expect(new Set(p3.flatMap((s) => s.categoryOriginals)).size).toBe(sm.categoryOriginalCount);
    expect(p3.filter((s) => !s.prefecture).length).toBe(sm.unknownPrefectureStoreCount);
  });
  it("サイト全体の店舗数 = Phase 3 ＋ Phase 3b ＋ 個別追加", () => {
    expect(site.stats.stores.storeCount).toBe(phase3Stores.stores.length + phase3b.stores.length + storeUpdates.length);
    expect(site.stats.stores.relationCount).toBe(
      phase3Relations.length + phase3b.relations.length + relationUpdates.length + entrantRelations.length,
    );
  });
  it("店舗IDに重複がなく、県別店舗数がカバレッジと一致する", () => {
    expect(new Set(site.stores.map((s) => s.id)).size).toBe(site.stores.length);
    for (const c of phase3Coverage.prefectures) {
      const ps = summarizeStores(p3.filter((s) => s.prefecture === c.prefecture));
      expect(ps.storeCount, c.prefecture).toBe(c.storeCount);
      expect(ps.publicUrlCount, c.prefecture).toBe(c.publicUrlCount);
    }
  });
  it("店舗×部門の関係がすべて部門ページと店舗ページに反映されている", () => {
    for (const rel of phase3Relations) {
      const store = site.stores.find((s) => s.id === rel.storeId)!;
      const cat = store.categories.find((c) => c.relationId === rel.relationId)!;
      expect(cat.categoryOriginal).toBe(rel.categoryOriginal);
      const d = site.divisions.find((x) => x.id === cat.divisionId)!;
      expect(d.categoryOriginal).toBe(rel.categoryOriginal);
      expect(d.stores.map((s) => s.id)).toContain(rel.storeId);
    }
  });
  it("差分更新の店舗（abc＋）を、根拠の強さどおりの確認状態で反映する", () => {
    const abc = site.stores.find((s) => s.id === "mh26-upd-store-0001")!;
    expect(abc.origin).toBe("update");
    expect(abc.name).toBe("abc＋");
    expect(abc.prefectureName).toBe("神奈川県");
    expect(abc.listingAreas).toEqual(["厚木"]);
    expect(abc.formalElectionArea).toBeUndefined();
    expect(abc.confidence).toBe("probable");
    expect(abc.categories.map((c) => c.categoryOriginal)).toEqual(["デリヘル部門"]);
    expect(abc.storePublicUrl).toMatch(/^https:\/\/www\.cityheaven\.net\//);
    expect(abc.entrantNames).toEqual([]);
    const d = site.divisions.find((x) => x.id === abc.categories[0].divisionId)!;
    expect(d.prefectureName).toBe("神奈川県");
    expect(d.listingArea).toBe("厚木");
    expect(d.stores.map((s) => s.id)).toEqual(["mh26-upd-store-0001"]);
    const kanagawa = site.prefectures.find((p) => p.slug === "kanagawa")!;
    expect(kanagawa.areas.map((a) => a.name)).toContain("厚木");
    expect(kanagawa.status).toBe("confirmed");
  });
  it("店舗の confidence は Phase 3 の値のまま", () => {
    for (const raw of phase3Stores.stores) {
      expect(site.stores.find((s) => s.id === raw.storeId)!.confidence).toBe(raw.confidence);
    }
  });
  it("応援キャンペーンのみの店舗は参加店舗に含めない", () => {
    for (const c of campaignSupportStores) {
      expect(site.stores.some((s) => s.id === c.storeId || s.name === c.storeName)).toBe(false);
    }
  });
  it("県不明の店舗は地図に割り当てない", () => {
    const unknown = phase3Stores.stores.filter((s) => !s.prefecture).map((s) => s.storeId).sort();
    expect(site.unknownPrefecture!.stores.map((s) => s.id).sort()).toEqual(unknown);
    for (const p of site.prefectures) for (const s of p.stores) expect(s.prefecture).toBe(p.name);
  });
  it("店舗の公開ページ・根拠URLはすべて安全な http(s)", () => {
    for (const s of site.stores) {
      if (s.storePublicUrl) expect(safeExternalUrl(s.storePublicUrl), s.id).not.toBeNull();
      if (s.participationEvidenceUrl) expect(safeExternalUrl(s.participationEvidenceUrl), s.id).not.toBeNull();
    }
  });
  it("v1 の店舗URL（都道府県×店名ID）がすべて Phase 3 店舗に解決できる", () => {
    const legacy = new Set(phase1Records.filter((r) => r.storeName).map((r) => storeIdOf(prefSlugOf(r), r.storeName!)));
    for (const id of legacy) expect(findStore(site, id), id).not.toBeNull();
  });
  it("Phase 1 の人物情報を維持し、店舗への接続は観測IDか、出場者の記録の所属店舗によるもののみ", () => {
    const phase1Names = new Set(phase1Records.flatMap((r) => r.entrantNames));
    const recordNames = new Set(entrantUpdates.map((e) => e.name));
    expect(new Set(site.entrants.map((e) => e.name))).toEqual(new Set([...phase1Names, ...recordNames]));
    for (const e of site.entrants) {
      if (e.records.length === 0) {
        // 観測のない出場者は、出場者の記録（所属店舗・名前が一致）から作られたものだけ
        expect(e.entrantRecord, e.name).toBeTruthy();
        expect(entrantUpdates.some((r) => r.storeId === e.storeId && r.name === e.name), e.name).toBe(true);
        continue;
      }
      if (!e.storeId) continue;
      const store = site.stores.find((s) => s.id === e.storeId)!;
      expect(e.records.every((r) => store.phase1RecordIds.includes(r.id)), e.name).toBe(true);
    }
  });
});

describe("noindex", () => {
  it("検索エンジンへの登録を控える設定を維持している", () => {
    const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(layout).toMatch(/robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  });
});
