import { describe, expect, it } from "vitest";
import {
  buildModel,
  deriveStatus,
  entrantHref,
  findDivision,
  findPrefectureView,
  findStore,
  regionsWithPrefectures,
  sameNameDivisions,
  summarize,
  variantDivisions,
} from "@/lib/model";
import { adaptRecord, dateOnly } from "@/lib/phase1";
import { model, modelWithStores, rawRecords, records } from "./fixtures";

describe("アダプター", () => {
  it("null を undefined にし、文字列は変更しない", () => {
    const r = adaptRecord(rawRecords[3], "phase1");
    expect(r.categoryOriginal).toBe("コスプレ部門🎀");
    expect(r.categoryNormalized).toBe("コスプレ部門");
    expect(r.prefecture).toBe("大阪府");
    expect(r.entrantUrl).toBeUndefined();
    expect(r.formalElectionArea).toBeUndefined();
    expect(r.dataset).toBe("phase1");
  });
  it("entrantNames を優先し、なければ entrantName を使う", () => {
    expect(adaptRecord(rawRecords[1], "phase1").entrantNames).toEqual(["テスト出場者B", "テスト出場者C"]);
    expect(adaptRecord(rawRecords[3], "phase1").entrantNames).toEqual(["テスト出場者D"]);
    expect(adaptRecord(rawRecords[2], "phase1").entrantNames).toEqual([]);
  });
  it("id を維持する", () => {
    expect(records.map((r) => r.id)).toEqual(rawRecords.map((r) => r.id));
  });
  it("日時は日付部分だけ取り出す", () => {
    expect(dateOnly("2026-10-05T02:20:25+00:00")).toBe("2026-10-05");
    expect(dateOnly("2026-10-05")).toBe("2026-10-05");
    expect(dateOnly(undefined)).toBeUndefined();
  });
});

describe("listingArea と formalElectionArea の分離", () => {
  it("formalElectionArea を listingArea から補完しない", () => {
    for (const r of records) expect(r.formalElectionArea).toBeUndefined();
    expect(records[0].listingArea).toBe("テスト市");
  });
  it("元データに formalElectionArea があればそのまま保持する", () => {
    const r = adaptRecord({ ...rawRecords[0], formalElectionArea: "正式テスト区" }, "phase1");
    expect(r.formalElectionArea).toBe("正式テスト区");
    expect(r.listingArea).toBe("テスト市");
  });
  it("地域階層は listingArea を使う", () => {
    const k = findPrefectureView(model, "kanagawa")!;
    expect(k.areas.map((a) => a.name)).toEqual(["テスト市"]);
  });
});

describe("地図の状態", () => {
  it("confirmed / candidate / searched_no_evidence を判定する", () => {
    expect(findPrefectureView(model, "kanagawa")!.status).toBe("confirmed");
    expect(findPrefectureView(model, "osaka")!.status).toBe("candidate");
    expect(findPrefectureView(model, "fukuoka")!.status).toBe("candidate");
    expect(findPrefectureView(model, "okinawa")!.status).toBe("searched_no_evidence");
    expect(deriveStatus([])).toBe("searched_no_evidence");
  });
  it("状態別の県数をデータから集計する", () => {
    expect(model.stats.statusCounts).toEqual({ confirmed: 1, candidate: 2, searched_no_evidence: 44 });
    expect(model.stats.prefectureTotal).toBe(47);
    expect(model.stats.prefecturesWithData).toBe(3);
  });
});

describe("全国集計", () => {
  it("件数をデータから数える", () => {
    const s = model.stats;
    expect(s.recordCount).toBe(7);
    expect(s.byConfidence).toEqual({ confirmed: 1, probable: 2, unverified: 4 });
    expect(s.categoryNameCount).toBe(6);
    expect(s.listingAreaCount).toBe(3);
    expect(s.unknownListingAreaRecordCount).toBe(3);
    expect(s.storeCount).toBe(2);
    expect(s.entrantCount).toBe(4);
    expect(s.unknownPrefectureRecordCount).toBe(2);
    expect(s.lastCheckedAt).toBe("2026-10-05");
  });
});

describe("県別集計", () => {
  it("観測・部門・掲載地域・店舗・出場者・確認状態別を集計する", () => {
    const s = findPrefectureView(model, "kanagawa")!.summary;
    expect(s.recordCount).toBe(2);
    expect(s.categoryNameCount).toBe(1);
    expect(s.listingAreaCount).toBe(1);
    expect(s.storeCount).toBe(1);
    expect(s.entrantCount).toBe(3);
    expect(s.byConfidence).toEqual({ confirmed: 1, probable: 1, unverified: 0 });
  });
  it("県の合計＋地域未判明＝全国", () => {
    const sum = model.prefectures.reduce((n, p) => n + p.recordCount, 0) + model.unknownPrefecture!.recordCount;
    expect(sum).toBe(model.stats.recordCount);
  });
  it("地方ごとの件数", () => {
    const regions = regionsWithPrefectures(model);
    expect(regions.find((r) => r.region.id === "kanto")!.recordCount).toBe(2);
    expect(regions.find((r) => r.region.id === "shikoku")!.recordCount).toBe(0);
  });
});

describe("部門・店舗・出場者", () => {
  it("都道府県×掲載地域×部門名で部門をまとめる", () => {
    const d = modelWithStores.divisions.find((x) => x.categoryOriginal === "美尻美脚部門")!;
    expect(d.records.map((r) => r.id)).toEqual(["t-1", "t-2"]);
    expect(d.entrantCount).toBe(3);
    expect(d.stores.map((s) => s.name)).toEqual(["テスト店舗X"]);
    expect(d.stores[0].relationConfidence).toBe("confirmed");
    expect(d.confidence).toBe("confirmed");
    expect(findDivision(modelWithStores, d.id)).toBe(d);
  });
  it("categoryOriginal を原文のまま保持し、似た名前を統合しない", () => {
    const names = model.divisions.map((d) => d.categoryOriginal);
    for (const n of ["美尻美脚部門", "美尻・美脚部門", "コスプレ部門🎀", "かわいいアイドル部門", "アイドル・可愛い部門"]) {
      expect(names).toContain(n);
    }
  });
  it("表記揺れの可能性がある部門を区別して返す", () => {
    const d = model.divisions.find((x) => x.categoryOriginal === "美尻美脚部門")!;
    expect(sameNameDivisions(model, d)).toEqual([]);
    expect(variantDivisions(model, d).map((x) => x.categoryOriginal)).toEqual(["美尻・美脚部門"]);
  });
  it("店舗ページの単位", () => {
    const s = modelWithStores.stores.find((x) => x.name === "テスト店舗X")!;
    expect(s.id).toBe("t-store-x");
    expect(findStore(modelWithStores, s.id)).toBe(s);
    expect(s.entrantNames.sort()).toEqual(["テスト出場者A", "テスト出場者B", "テスト出場者C"]);
    expect(s.divisions).toHaveLength(1);
  });
  it("出場者は店舗ページへ、店舗不明なら部門の観測へ遷移する", () => {
    const a = modelWithStores.entrants.find((e) => e.name === "テスト出場者A")!;
    expect(entrantHref(a)).toMatch(/^\/store\/t-store-x#e[a-z0-9]+$/);
    // 店舗レイヤーがなければ部門の観測へ
    expect(entrantHref(model.entrants.find((e) => e.name === "テスト出場者A")!)).toMatch(/^\/division\/d[a-z0-9]+#t-1$/);
    const noStore = buildModel([
      { ...records[0], storeName: undefined },
    ]).entrants[0];
    expect(entrantHref(noStore)).toMatch(/^\/division\/d[a-z0-9]+#t-1$/);
  });
});

describe("部分データ・地域未判明", () => {
  it("県不明レコードを削除せず地域未判明にまとめる", () => {
    const u = model.unknownPrefecture!;
    expect(u.recordCount).toBe(2);
    expect(u.name).toBe("地域未判明");
    expect(u.areas.map((a) => a.label)).toEqual(["テスト駅前", "掲載地域未判明"]);
    expect(u.divisions.every((d) => d.prefectureName === "地域未判明")).toBe(true);
  });
  it("店舗・出場者不明の部門", () => {
    const d = model.divisions.find((x) => x.categoryOriginal === "テスト部門")!;
    expect(d.entrantCount).toBe(0);
    expect(d.stores).toEqual([]);
    expect(d.listingArea).toBeUndefined();
  });
  it("確認日のないレコードがあっても集計できる", () => {
    expect(summarize([records[5]]).lastCheckedAt).toBeNull();
  });
});

describe("空データ", () => {
  it("0件でも47都道府県と空の集計を返す", () => {
    const empty = buildModel([]);
    expect(empty.prefectures).toHaveLength(47);
    expect(empty.prefectures.every((p) => p.status === "searched_no_evidence" && p.areas.length === 0)).toBe(true);
    expect(empty.unknownPrefecture).toBeNull();
    expect(empty.divisions).toEqual([]);
    expect(empty.stats.recordCount).toBe(0);
    expect(empty.stats.statusCounts).toEqual({ confirmed: 0, candidate: 0, searched_no_evidence: 47 });
    expect(empty.stats.lastCheckedAt).toBeNull();
  });
});
