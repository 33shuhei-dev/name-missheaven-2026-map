import { describe, expect, it } from "vitest";
import { storeUpdates } from "@/data/store-updates";

/**
 * 店名中の地名で都道府県を確定した店舗（2026-10-27 の運営判断：一つの都道府県にしかない地名に限る）。
 * 地名の一覧は scripts/research/place_pref.py。根拠の地名が店名に含まれ、都道府県が地名と一致していること。
 */
const PLACE_TO_PREF: Record<string, string> = {
  札幌: "北海道", 新宿: "東京都", 秋葉原: "東京都", 横浜: "神奈川県", 浜松: "静岡県", 三河安城: "愛知県", 雄琴: "滋賀県", 福原: "兵庫県",
};

describe("店名中の地名で都道府県を確定した店舗", () => {
  const stores = storeUpdates.filter((s) => (s.notes ?? "").includes("店名中の地名「"));

  it("対象がある", () => {
    expect(stores.length).toBeGreaterThan(0);
  });

  it("根拠の地名が店名に含まれ、都道府県が一致する。町田・川崎・府中や都道府県名そのものは根拠にしない", () => {
    for (const s of stores) {
      const word = /店名中の地名「([^」]+)」/.exec(s.notes ?? "")![1];
      expect(s.storeName, s.storeId).toContain(word);
      if (PLACE_TO_PREF[word]) expect(s.prefecture, s.storeId).toBe(PLACE_TO_PREF[word]);
      expect(["町田", "川崎", "府中", "東京", "大阪", "京都", "京橋", "日本橋"]).not.toContain(word);
      expect(s.storePublicUrl ?? null, s.storeId).toBeNull();
    }
  });
});
