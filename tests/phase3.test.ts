import { describe, expect, it } from "vitest";
import type { Phase3Coverage, Phase3RawStore, Phase3StoresFile } from "@/data/types";
import { buildModel, findPrefectureView, findStore } from "@/lib/model";
import { adaptStore, adaptStoreLayer, linkCountFacts } from "@/lib/phase3";
import { validatePhase3, validateStoreUpdates, type Phase3Input } from "@/lib/validate";
import { PREFECTURES } from "@/data/geo";
import { layer, model, modelWithStores as m, rawRecords, rawRelations, rawSources, rawStores } from "./fixtures";

describe("店舗アダプター", () => {
  it("storeId を主キーにし、文字列・confidence を変更しない", () => {
    const s = adaptStore(rawStores[0]);
    expect(s.id).toBe("t-store-x");
    expect(s.name).toBe("テスト店舗X");
    expect(s.nameOriginals).toEqual(["テスト店舗X", "テスト店舗 X"]);
    expect(s.confidence).toBe("confirmed");
    expect(s.formalElectionArea).toBeUndefined();
  });
  it("URL があっても confidence を昇格しない", () => {
    const s = adaptStore({ ...rawStores[1], storePublicUrl: "https://example.com/y" });
    expect(s.confidence).toBe("unverified");
  });
  it("null の URL は undefined（URL を生成しない）", () => {
    const s = adaptStore(rawStores[1]);
    expect(s.storePublicUrl).toBeUndefined();
    expect(s.participationEvidenceUrl).toBe("https://example.com/source/4");
  });
});

describe("店舗・部門・地域の統合", () => {
  it("店舗×部門は多対多で、部門ページに店舗が並ぶ", () => {
    const store = m.stores.find((s) => s.id === "t-store-x")!;
    expect(store.categories.map((c) => c.categoryOriginal)).toEqual(["美尻美脚部門"]);
    const d = m.divisions.find((x) => x.categoryOriginal === "コスプレ部門🎀")!;
    expect(d.stores.map((s) => s.id)).toEqual(["t-store-y"]);
    expect(d.stores[0].hasPublicUrl).toBe(false);
  });
  it("部門原文を統合しない（categoryNormalized は検索補助のみ）", () => {
    expect(m.divisions.map((d) => d.categoryOriginal)).toContain("コスプレ部門🎀");
    expect(m.divisions.map((d) => d.categoryOriginal)).not.toContain("コスプレ部門");
  });
  it("部門未確認の店舗も掲載地域に表示される", () => {
    const ehime = findPrefectureView(m, "ehime")!;
    expect(ehime.areas.map((a) => a.label)).toEqual(["テスト温泉"]);
    expect(ehime.areas[0].stores.map((s) => s.name)).toEqual(["テスト新店舗"]);
    expect(ehime.areas[0].divisions).toEqual([]);
    expect(ehime.stores[0].categories).toEqual([]);
  });
  it("県不明の店舗は地図に割り当てず、地域未判明に入る", () => {
    expect(m.prefectures.some((p) => p.stores.some((s) => s.id === "t-store-unknown"))).toBe(false);
    expect(m.unknownPrefecture!.stores.map((s) => s.id)).toEqual(["t-store-unknown"]);
    expect(m.unknownPrefecture!.areas.find((a) => !a.name)!.stores.map((s) => s.id)).toContain("t-store-unknown");
  });
  it("formalElectionArea を補完しない", () => {
    for (const s of m.stores) expect(s.formalElectionArea).toBeUndefined();
  });
});

describe("地図の状態（観測＋店舗）", () => {
  it("店舗だけの県も状態に反映する（confirmed と candidate を混同しない）", () => {
    expect(findPrefectureView(model, "ehime")!.status).toBe("searched_no_evidence");
    expect(findPrefectureView(m, "ehime")!.status).toBe("confirmed");
    expect(findPrefectureView(m, "osaka")!.status).toBe("candidate");
    expect(m.stats.statusCounts).toEqual({ confirmed: 2, candidate: 2, searched_no_evidence: 43 });
  });
});

describe("店舗の集計", () => {
  it("storeId の重複なしで数える", () => {
    expect(m.stats.stores.storeCount).toBe(4);
    expect(m.stats.stores.byConfidence).toEqual({ confirmed: 2, probable: 0, unverified: 2 });
    expect(m.stats.stores.publicUrlCount).toBe(2);
    expect(m.stats.stores.newSincePhase1).toBe(2);
    expect(m.stats.stores.unknownPrefectureStoreCount).toBe(1);
    expect(m.stats.stores.relationCount).toBe(2);
  });
});

describe("店舗と観測・人物の接続", () => {
  it("観測IDで確実に接続できる人物だけ店舗に結び付く", () => {
    const x = m.stores.find((s) => s.id === "t-store-x")!;
    expect(x.records.map((r) => r.id)).toEqual(["t-1", "t-2"]);
    expect(m.entrants.find((e) => e.name === "テスト出場者D")!.storeId).toBe("t-store-y");
    expect(m.storeIdByRecord["t-1"]).toBe("t-store-x");
  });
  it("v1 までの店舗URL（都道府県×店名ID）でも店舗を表示できる", () => {
    const x = m.stores.find((s) => s.id === "t-store-x")!;
    const legacy = buildModel(model.records).stores; // 店舗レイヤーなし
    expect(legacy).toEqual([]);
    expect(x.legacyIds).toHaveLength(1);
    expect(findStore(m, x.legacyIds[0])).toBe(x);
  });
});

describe("参加根拠と公開ページ", () => {
  it("用途の違う2つのURLを別々に保持し、情報源の役割を引ける", () => {
    const x = m.stores.find((s) => s.id === "t-store-x")!;
    expect(x.storePublicUrl).toBe("https://example.com/store/x");
    expect(x.participationEvidenceUrl).toBe("https://example.com/source/1");
    expect(x.evidenceSource?.publisherRole).toBe("business_evidence");
    expect(x.publicSource?.publisherRole).toBe("store_public_page");
  });
  it("sourceType=official でも店舗の告知は大会運営と区別できる", () => {
    const n = m.stores.find((s) => s.id === "t-store-new")!;
    expect(n.sourceType).toBe("official");
    expect(n.evidenceSource?.publisherRole).toBe("store_announcement");
  });
});

describe("Phase 2 人数の結び付け", () => {
  it("店舗単位・confirmed・数値・店名と県が1店舗に一致するものだけ", () => {
    expect(layer.countFacts.map((c) => [c.id, c.storeId])).toEqual([["t-count-1", "t-store-x"]]);
    expect(m.stores.find((s) => s.id === "t-store-x")!.countFacts[0].participantCount).toBe(5);
    expect(m.stores.find((s) => s.id === "t-store-y")!.countFacts).toEqual([]);
  });
  it("同名店舗が複数ある場合は結び付けない", () => {
    const dup = [adaptStore(rawStores[0]), { ...adaptStore(rawStores[0]), id: "t-store-x2" }];
    const facts = linkCountFacts(
      [{ id: "c", scope: "store", participantCount: 2, countType: "declared_web_application_count", confidence: "confirmed", prefecture: "神奈川県", storeName: "テスト店舗X" }],
      dup,
    );
    expect(facts).toEqual([]);
  });
});

describe("Phase 3 の検証", () => {
  const coverage: Phase3Coverage = {
    unassignedStoreCount: 1,
    prefectures: PREFECTURES.map((p) => {
      const ss = rawStores.filter((s) => s.prefecture === p.name);
      const recs = rawRecords.filter((r) => r.prefecture === p.name);
      const status = recs.some((r) => r.confidence === "confirmed") || ss.some((s) => s.confidence === "confirmed")
        ? "confirmed"
        : recs.length || ss.length
          ? "candidate"
          : "searched_no_evidence";
      return {
        prefecture: p.name,
        prefectureCode: String(p.code).padStart(2, "0"),
        status,
        storeCount: ss.length,
        confirmedCount: ss.filter((s) => s.confidence === "confirmed").length,
        probableCount: ss.filter((s) => s.confidence === "probable").length,
        unverifiedCount: ss.filter((s) => s.confidence === "unverified").length,
        publicUrlCount: ss.filter((s) => s.storePublicUrl).length,
        listingAreas: [],
        divisionCount: 0,
      };
    }),
  };
  const summary = {
    finalStoresIncludingCandidates: 4,
    confirmedStores: 2,
    probableStores: 0,
    unverifiedStores: 2,
    newSincePhase1: 2,
    storeCategoryRelationCount: 2,
    categoryOriginalCount: 2,
    publicUrlCount: 2,
    participationEvidenceUrlCount: 4,
    unknownPrefectureStoreCount: 1,
    prefecturesWithStores: 3,
    prefecturesWithConfirmedStores: 2,
    listingAreaConnections: 3,
    campaignSupportOnlyExcluded: 0,
  };
  const input = (patch: Partial<Phase3Input> = {}, stores: Phase3RawStore[] = rawStores): Phase3Input => ({
    storesFile: { schemaVersion: "1", summary, stores } as Phase3StoresFile,
    relations: rawRelations,
    sources: rawSources,
    campaignStores: [],
    coverage,
    confirmedStores: stores.filter((s) => s.confidence === "confirmed"),
    ...patch,
  });
  const errors = (i: Phase3Input) => validatePhase3(i, rawRecords).filter((x) => x.level === "error").map((x) => x.message);

  it("正しいデータはエラーなし", () => {
    expect(errors(input())).toEqual([]);
  });
  it("storeId 重複を検出", () => {
    expect(errors(input({}, [...rawStores, rawStores[0]])).some((m) => m.includes("重複"))).toBe(true);
  });
  it("存在しない店舗への関係・Phase 1 にない部門原文を検出", () => {
    const bad = [...rawRelations, { ...rawRelations[0], relationId: "t-rel-x", storeId: "nope", categoryOriginal: "存在しない部門" }];
    const e = errors(input({ relations: bad }));
    expect(e.some((m) => m.includes("存在しない storeId"))).toBe(true);
    expect(e.some((m) => m.includes("Phase 1 にない部門原文"))).toBe(true);
  });
  it("店舗×部門の重複を検出", () => {
    const e = errors(input({ relations: [...rawRelations, { ...rawRelations[0], relationId: "t-rel-dup" }] }));
    expect(e.some((m) => m.includes("同じ店舗×部門"))).toBe(true);
  });
  it("不正な店舗URL・confidence を検出", () => {
    const stores = rawStores.map((s, i) => (i === 1 ? { ...s, storePublicUrl: "javascript:alert(1)", confidence: "sure" } : s));
    const e = errors(input({}, stores));
    expect(e.some((m) => m.includes("storePublicUrl"))).toBe(true);
    expect(e.some((m) => m.includes("confidence"))).toBe(true);
  });
  it("店舗名のある Phase 1 観測が店舗に接続されていなければ検出", () => {
    const stores = rawStores.map((s, i) => (i === 1 ? { ...s, phase1RecordIds: [] } : s));
    expect(errors(input({}, stores)).some((m) => m.includes("接続されていません"))).toBe(true);
  });
  it("応援キャンペーンのみの店舗が参加店舗に混ざっていれば検出", () => {
    const camp = [{ storeId: "t-store-y", storeName: "テスト店舗Y", prefecture: "大阪府", listingArea: null, participationEvidenceUrl: null, storePublicUrl: null, confidence: "confirmed", participationType: "campaign_support" }];
    expect(errors(input({ campaignStores: camp })).some((m) => m.includes("応援キャンペーン"))).toBe(true);
  });
  it("カバレッジの状態の食い違いを検出", () => {
    const cov = JSON.parse(JSON.stringify(coverage)) as Phase3Coverage;
    cov.prefectures.find((p) => p.prefecture === "愛媛県")!.status = "candidate";
    expect(errors(input({ coverage: cov })).some((m) => m.includes("status"))).toBe(true);
  });
  it("summary の食い違いを検出", () => {
    const i = input();
    i.storesFile = { ...i.storesFile, summary: { ...summary, confirmedStores: 99 } };
    expect(errors(i).some((m) => m.includes("confirmedStores"))).toBe(true);
  });
});

describe("店舗の差分更新の検証", () => {
  const base = { stores: rawStores, relations: rawRelations, sources: rawSources };
  const newStore: Phase3RawStore = {
    ...rawStores[2],
    storeId: "t-upd-1",
    storeName: "テスト追加店",
    storeNameOriginals: ["テスト追加店"],
    categoryOriginal: "テスト新部門",
    categoryOriginals: ["テスト新部門"],
    sourceIds: ["t-upd-src"],
    confidence: "probable",
  };
  const upd = {
    stores: [newStore],
    relations: [{ relationId: "t-upd-rel", storeId: "t-upd-1", categoryOriginal: "テスト新部門", confidence: "probable", sourceIds: [], phase1RecordIds: [] }],
    sources: [{ sourceId: "t-upd-src", url: "https://example.com/upd", sourceType: "store", accessStatus: "user_screenshot_only", publisherRole: "store_announcement", storeIds: ["t-upd-1"], relationIds: ["t-upd-rel"] }],
  };
  const errors = (u: typeof upd) => validateStoreUpdates(u, base, rawRecords).filter((i) => i.level === "error").map((i) => i.message);
  it("正しい追加はエラーなし（新しい部門原文も可）", () => {
    expect(errors(upd)).toEqual([]);
  });
  it("既存と同じ storeId・同じ県の同名店舗は重複として検出", () => {
    expect(errors({ ...upd, stores: [{ ...newStore, storeId: "t-store-x" }] }).some((m) => m.includes("重複"))).toBe(true);
    expect(errors({ ...upd, stores: [{ ...newStore, storeName: "テスト店舗X", storeNameOriginals: ["テスト店舗X"], prefecture: "神奈川県" }] }).some((m) => m.includes("同じ県・同じ店名"))).toBe(true);
  });
  it("参加根拠URLのない追加・不正URLは検出", () => {
    expect(errors({ ...upd, stores: [{ ...newStore, participationEvidenceUrl: null }] }).some((m) => m.includes("参加根拠URL"))).toBe(true);
    expect(errors({ ...upd, stores: [{ ...newStore, storePublicUrl: "javascript:x" }] }).some((m) => m.includes("storePublicUrl"))).toBe(true);
  });
  it("差分の店舗はサイトに反映され、Phase 3 の店舗と区別できる", () => {
    const l = adaptStoreLayer({ stores: rawStores, relations: rawRelations, sources: rawSources, countFacts: [], updates: upd });
    const mm = buildModel(m.records, { layer: l });
    expect(mm.stores.find((s) => s.id === "t-upd-1")!.origin).toBe("update");
    expect(mm.stores.find((s) => s.id === "t-store-x")!.origin).toBe("phase3");
    expect(mm.divisions.some((d) => d.categoryOriginal === "テスト新部門" && d.stores.some((s) => s.id === "t-upd-1"))).toBe(true);
  });
});
