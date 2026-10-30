import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { entrantUpdates } from "@/data/entrant-updates";

/** 掲載依頼（DM）で追加：米澤ちひろ（華椿・東京都・お姉さん部門）、店舗担当者からのもえたく（石川県・3名） */
describe("掲載依頼：米澤ちひろ（華椿）", () => {
  const items = buildSearchIndex(site);
  it("既存の華椿（東京都）に1件追加。未確認・部門は依頼文どおり", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0032")!;
    expect(rec.storeId).toBe("mh26-p3b-store-5f1324cb6e24cb72");
    expect(rec.confidence).toBe("unverified");
    expect(rec.categoryOriginal).toBe("お姉さん部門");
    expect(site.stores.filter((s) => s.name === "華椿" && s.prefectureName === "東京都")).toHaveLength(1);
    expect(searchItems(items, { q: "米澤ちひろ" }).some((h) => h.item.kind === "entrant")).toBe(true);
  });
});

describe("掲載依頼（店舗担当者）：もえたく（石川県・3名）", () => {
  const store = site.stores.find((s) => s.id === "mh26-p3b-store-0f4795227312effb")!;
  const items = buildSearchIndex(site);
  it("既存のもえたく（石川県）に3名追加。1店舗のまま", () => {
    expect(store.name).toBe("もえたく");
    expect(store.prefectureName).toBe("石川県");
    expect(site.stores.filter((x) => x.name === "もえたく" && x.prefectureName === "石川県")).toHaveLength(1);
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name).sort()).toEqual(["あかね", "さえ", "なな"].sort());
    for (const c of ["人気フード部門", "初ノミネート部門", "もてなし癒し女子部門"]) expect(store.categoryOriginals).toContain(c);
  });
  it("検索で辿れる", () => {
    expect(searchItems(items, { q: "もえたく", kind: "store" }).some((h) => h.item.href === `/store/${store.id}`)).toBe(true);
  });
});

describe("掲載依頼：はな（エコ梅田店・大阪府）", () => {
  it("1店舗1名。大阪府、バッジ確認（probable）、部門は空欄、公開ページURLは推測しない", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0007")!;
    expect(store.name).toBe("エコ梅田店");
    expect(store.prefectureName).toBe("大阪府");
    expect(store.storePublicUrl ?? null).toBeNull();
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name)).toEqual(["はな"]);
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0035")!;
    expect(rec.confidence).toBe("probable");
    expect(rec.evidence).toContain("ニューヒロイン");
    expect(rec.categoryOriginal).toBeNull();
  });
});

describe("米澤ちひろ：本人のページのリンク", () => {
  it("依頼者指定のURL（?lo=1付き）を本人のページとして設定", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0032")!;
    expect(rec.personalUrl).toBe("https://www.cityheaven.net/tokyo/A1324/A132401/87tsubaki/girlid-63884920/?lo=1");
  });
});

describe("掲載依頼：ななみ（風神会館・東京都・ギャル（白・黒）部門）", () => {
  it("1店舗1名。バッジ確認（probable）、既存の部門表記に合わせる", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0008")!;
    expect(store.name).toBe("風神会館");
    expect(store.prefectureName).toBe("東京都");
    expect(store.categoryOriginals).toContain("ギャル（白・黒）部門");
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name)).toEqual(["ななみ"]);
    expect(entrantUpdates.find((e) => e.entrantId === "mh26-ent-0036")!.confidence).toBe("probable");
  });
});
