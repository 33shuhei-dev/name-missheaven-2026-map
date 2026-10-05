import { describe, expect, it } from "vitest";
import { phase3b, phase3Stores, site } from "@/lib/data";
import { storeUpdates } from "@/data/store-updates";
import { PREFECTURES } from "@/data/geo";
import { safeExternalUrl } from "@/lib/links";
import { normalizeForSearch } from "@/lib/text";
import { STORE_CONFIDENCE_LABEL } from "@/lib/labels";
import recheck from "@/data/phase3b/recheck.json";

/**
 * Phase 3b（全国走査）成果物の検証。
 * 検索結果の抜粋だけで確認した店舗を「確認済み」にしないこと、人物のページURLを保存しないこと、
 * 既存の店舗と重複しないこと、47都道府県の調査状況が揃っていることを確認する。
 */
const stores = phase3b.stores;

describe("Phase 3b 全国走査", () => {
  it("47都道府県すべてに調査状況がある", () => {
    expect(phase3b.coverage.map((c) => c.prefecture).sort()).toEqual(PREFECTURES.map((p) => p.name).sort());
    for (const c of phase3b.coverage) {
      expect(["searched", "not_searched"]).toContain(c.researchStatus);
      expect(["found", "insufficient"]).toContain(c.dataStatus);
      expect(c.storesFound).toBe(c.newStores + c.matchedExisting);
    }
  });

  it("県別の新規店舗数がカバレッジと一致する", () => {
    for (const c of phase3b.coverage) {
      expect(stores.filter((s) => s.prefecture === c.prefecture).length, c.prefecture).toBe(c.newStores);
    }
  });

  it("検索結果だけで確認した店舗は確認済みにしない", () => {
    for (const s of stores) {
      expect(s.confidence, s.storeName).not.toBe("confirmed");
      if (s.verificationMethod === "search_index_single") expect(s.confidence).toBe("unverified");
      if (s.verificationMethod === "search_index_multiple") expect(s.confidence).toBe("probable");
    }
  });

  it("店舗ID・CityHeaven 店舗キーに重複がない", () => {
    expect(new Set(stores.map((s) => s.storeId)).size).toBe(stores.length);
    const keys = stores.map((s) => s.cityheavenKey as string);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("既存（Phase 3・個別追加）と同じ県・同じ店名の店舗を重複追加していない", () => {
    const existing = new Set(
      [...phase3Stores.stores, ...storeUpdates].flatMap((s) => s.storeNameOriginals.map((n) => `${s.prefecture}|${normalizeForSearch(n)}`)),
    );
    for (const s of stores) {
      for (const n of s.storeNameOriginals) expect(existing.has(`${s.prefecture}|${normalizeForSearch(n)}`), n).toBe(false);
    }
  });

  it("店舗公開URLは CityHeaven の店舗ページ、根拠URLは安全な http(s)", () => {
    for (const s of stores) {
      expect(s.storePublicUrl).toMatch(/^https:\/\/www\.cityheaven\.net\/[a-z]+\/A\d{4}\/A\d{6}\/[A-Za-z0-9_-]+\/$/);
      expect(s.storePublicUrl!.startsWith(`https://www.cityheaven.net/${PREFECTURES.find((p) => p.name === s.prefecture)!.slug}/`)).toBe(true);
      expect(safeExternalUrl(s.participationEvidenceUrl)).not.toBeNull();
    }
    for (const src of phase3b.sources) expect(safeExternalUrl(src.url), src.sourceId).not.toBeNull();
  });

  it("人物のページURL・人物名を保存していない", () => {
    const urls = JSON.stringify(phase3b).match(/https?:\/\/[^"\s]+/g) ?? [];
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) expect(u, u).not.toMatch(/girlid|GirlDetail|diary/i);
    for (const s of stores) expect(s.storeName).not.toMatch(/^「/);
  });

  it("正式選挙エリアを補完していない", () => {
    for (const s of stores) expect(s.formalElectionArea).toBeNull();
  });

  it("Phase 3b は地図の「確認済み」の県を増やさない（検索結果のみの根拠のため）", () => {
    const confirmedByOthers = new Set(
      site.prefectures.filter((p) => p.summary.byConfidence.confirmed > 0 || p.stores.some((st) => st.origin !== "phase3b" && st.confidence === "confirmed")).map((p) => p.name),
    );
    for (const p of site.prefectures) {
      if (p.status === "confirmed") expect(confirmedByOthers.has(p.name), p.name).toBe(true);
    }
  });

  it("サイトに反映され、Phase 3b 由来として区別できる", () => {
    const p3b = site.stores.filter((s) => s.origin === "phase3b");
    expect(p3b).toHaveLength(stores.length);
    for (const s of p3b.slice(0, 20)) {
      expect(s.verificationMethod).toBeTruthy();
      expect(s.prefSlug).not.toBe("unknown");
    }
  });

  it("再チェックで除外した店舗はデータに残っていない", () => {
    expect(recheck.excluded.length).toBeGreaterThan(0);
    const ids = new Set(stores.map((s) => s.storeId));
    const urls = new Set(stores.map((s) => s.storePublicUrl));
    for (const x of recheck.excluded) {
      expect(ids.has(x.storeId), x.storeName).toBe(false);
      expect(urls.has(x.storePublicUrl), x.storeName).toBe(false);
      expect(x.reason).toBeTruthy();
    }
    for (const src of phase3b.sources) for (const id of src.storeIds) expect(ids.has(id), src.sourceId).toBe(true);
  });

  it("参加情報のページ数と表示区分が一致し、集計が合う", () => {
    for (const s of stores) {
      expect(s.evidencePageCount, s.storeId).toBeGreaterThanOrEqual(1);
      expect(s.confidence, s.storeId).toBe(Number(s.evidencePageCount) >= 2 ? "probable" : "unverified");
    }
    const count = (c: string) => stores.filter((s) => s.confidence === c).length;
    expect(phase3b.summary.newStores).toBe(stores.length);
    expect(phase3b.summary.byConfidence).toEqual({ probable: count("probable"), unverified: count("unverified") });
    const covered = phase3b.coverage.reduce((n, c) => n + c.newStores, 0);
    expect(covered).toBe(stores.length);
  });

  it("店舗の表示名は確認できている内容を表す（「未確認」と表示しない）", () => {
    expect(STORE_CONFIDENCE_LABEL).toEqual({
      confirmed: "参加確認済み",
      probable: "参加情報あり",
      unverified: "参加情報を1件確認",
    });
    for (const label of Object.values(STORE_CONFIDENCE_LABEL)) expect(label).not.toMatch(/未確認|候補/);
  });
});
