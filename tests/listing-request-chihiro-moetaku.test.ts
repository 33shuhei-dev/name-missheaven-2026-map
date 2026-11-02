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

describe("掲載依頼：Otone（THE PREMIUM・神奈川県・高級嬢部門）", () => {
  it("1店舗1名。バッジ確認（probable）。店舗ページURLは推測しない", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0009")!;
    expect(store.name).toBe("THE PREMIUM");
    expect(store.prefectureName).toBe("神奈川県");
    expect(store.storePublicUrl ?? null).toBeNull();
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name)).toEqual(["Otone"]);
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0037")!;
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("高級嬢部門");
  });
});

describe("掲載依頼：ゆら（東京シャトールージュ・愛知県・かわいい部門）", () => {
  it("愛知県の1店舗1名。店名に「東京」があっても愛知県。バッジ確認（probable）", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0010")!;
    expect(store.name).toBe("東京シャトールージュ");
    expect(store.prefectureName).toBe("愛知県");
    expect(store.storePublicUrl).toBe("https://www.cityheaven.net/aichi/A2301/A230101/chateau/");
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name)).toEqual(["ゆら"]);
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0038")!;
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("かわいい部門");
    expect(rec.personalUrl).not.toContain("mygirl");
  });
});

describe("掲載依頼（本人）：藤咲 ルミナ（性竜門・北海道・ヘルス部門）", () => {
  it("既存の性竜門（北海道）に1名追加。バッジ確認（probable）", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0039")!;
    expect(rec.storeId).toBe("mh26-p3b-store-ef3a6c99651fd772");
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("ヘルス部門");
    expect(site.entrants.filter((e) => e.name === "藤咲 ルミナ")).toHaveLength(1);
    expect(site.stores.filter((s) => s.name.startsWith("性竜門") && s.prefectureName === "北海道")).toHaveLength(1);
  });
});

describe("掲載依頼：ふゆの（アラカルト・千葉県・ソープ部門）", () => {
  it("既存のアラカルト（千葉県）に1名追加。バッジ確認（probable）", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0040")!;
    expect(rec.storeId).toBe("mh26-p3b-store-432f65b4d8d4f179");
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("ソープ部門");
    expect(site.entrants.filter((e) => e.name === "ふゆの")).toHaveLength(1);
  });
});

describe("掲載依頼：ことり（イチャカワクラブ・香川県・極嬢部門）", () => {
  it("香川県の1店舗1名。バッジ確認（probable）。部門は既存の「極嬢部門」と同じ表記", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0011")!;
    expect(store.name).toBe("イチャカワクラブ");
    expect(store.prefectureName).toBe("香川県");
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name)).toEqual(["ことり"]);
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0041")!;
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("極嬢部門");
  });
});

describe("掲載依頼（お店）：ひなた（新宿ごほうびSPA・東京都・巨乳部門）", () => {
  it("東京都の1店舗1名。五反田店とは別の店舗。バッジ確認（probable）", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0012")!;
    expect(store.name).toBe("新宿ごほうびSPA");
    expect(store.prefectureName).toBe("東京都");
    expect(store.storePublicUrl).toBe("https://www.cityheaven.net/tokyo/A1304/A130401/gohoubispa-sj/");
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name)).toContain("ひなた");
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0042")!;
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("巨乳部門");
  });
});

describe("掲載依頼（お店）：新宿ごほうびSPA の在籍者（東京都・11人）", () => {
  it("ひなたと合わせて12人。部門はバッジの表記。probable。五反田店とは別", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0012")!;
    const names = site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name).sort();
    expect(names).toEqual(["あお", "えま", "かおり", "ことは", "けいか", "ちゆ", "つばき", "ひなた", "みい", "みお", "みく", "らん"].sort());
    for (const c of ["巨乳部門", "テクニシャン部門", "ロリっ子部門", "NG顔出し部門", "ヌルヌル部門"]) expect(store.categoryOriginals).toContain(c);
    for (const id of ["0043", "0044", "0045", "0046", "0047", "0048", "0049", "0050", "0051", "0052", "0053"]) {
      const rec = entrantUpdates.find((e) => e.entrantId === `mh26-ent-${id}`)!;
      expect(rec.confidence).toBe("probable");
      expect(rec.evidence).toContain("全国ミスヘブン総選挙2026");
    }
  });
});

describe("本人のDMで部門を補う：まこと（宇都宮select・ギャンブル大好き部門）", () => {
  it("同じ人のまま部門が付く。人数は増えない", () => {
    const store = site.stores.find((s) => s.id === "mh26-sns-store-e591353da9c4c1cb")!;
    expect(site.entrants.filter((e) => e.storeId === store.id && e.name === "まこと")).toHaveLength(1);
    expect(store.categoryOriginals).toContain("ギャンブル大好き部門");
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-h-4f71f759e6b34725")!;
    expect(rec.categoryOriginal).toBe("ギャンブル大好き部門");
  });
});

describe("掲載依頼（本人）：このは（スチュワーデス・新潟県・おっぱい部門）", () => {
  it("新潟県の1店舗1名。岐阜県のスチュアーデスとは別。URLは本人提供のもの。バッジ確認（probable）", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0013")!;
    expect(store.name).toBe("スチュワーデス");
    expect(store.prefectureName).toBe("新潟県");
    expect(store.storePublicUrl).toBe("https://www.cityheaven.net/niigata/A1501/A150101/stw/");
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name)).toEqual(["このは"]);
    expect(site.stores.filter((s) => s.name === "スチュアーデス").every((s) => s.prefectureName === "岐阜県")).toBe(true);
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0054")!;
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("おっぱい部門");
  });
});

describe("掲載依頼（本人）：じゅな（LALA・静岡県・次世代看板娘部門）", () => {
  it("既存のLALA（静岡県）に1名追加。部門は依頼文の原文のまま（統合しない）。unverified", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0055")!;
    expect(rec.storeId).toBe("mh26-nat-store-9bab0e77658398f2");
    expect(rec.confidence).toBe("unverified");
    expect(rec.categoryOriginal).toBe("次世代看板娘部門");
    expect(site.entrants.filter((e) => e.name === "じゅな")).toHaveLength(1);
  });
});

describe("掲載依頼（本人）：らん（夕月・愛媛県・2026新人部門）", () => {
  it("既存の夕月（愛媛県）に1名追加。部門は依頼文の原文（統合しない）。probable。同名の別人は別のまま", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0056")!;
    expect(rec.storeId).toBe("mh26-p3b-store-de125eaeb54195ea");
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("2026新人部門");
    const rans = site.entrants.filter((e) => e.name === "らん");
    expect(new Set(rans.map((e) => e.storeId)).size).toBe(rans.length);
  });
});
