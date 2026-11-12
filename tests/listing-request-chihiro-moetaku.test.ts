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
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name)).toContain("ことり");
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

describe("掲載依頼（本人）：あいか（ニューティアラ・茨城県・おっぱい自慢部門）", () => {
  it("既存のニューティアラ（茨城県）に1名追加。バッジ確認（probable）", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0057")!;
    expect(rec.storeId).toBe("mh26-sns-store-cc5f21ad4b1dc72c");
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("おっぱい自慢部門");
    expect(site.entrants.filter((e) => e.name === "あいか")).toHaveLength(1);
  });
});

describe("掲載依頼（本人）：さゆり（東京リップ池袋店・東京都・巨乳部門）", () => {
  it("東京都の新しい1店舗1名。unverified。上野店・立川店とは別。URLの個人用パラメータは除く", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0014")!;
    expect(store.name).toBe("東京リップ池袋店");
    expect(store.prefectureName).toBe("東京都");
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name)).toEqual(["さゆり"]);
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0058")!;
    expect(rec.confidence).toBe("unverified");
    expect(rec.categoryOriginal).toBe("巨乳部門");
    expect(rec.personalUrl).not.toContain("mypage_flg");
  });
});

describe("掲載依頼：雪鍋ましろ（しらゆき姫・香川県・大好き♡おっぱい部門）", () => {
  it("既存のしらゆき姫（香川県）に1名追加。バッジ確認（probable）。部門は既存の表記。同名の別人とは別", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0059")!;
    expect(rec.storeId).toBe("mh26-p3b-store-8ab29c22e82643a6");
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("大好き♡おっぱい部門");
    expect(site.entrants.filter((e) => e.name === "雪鍋ましろ")).toHaveLength(1);
  });
});

describe("掲載依頼：ヨル（CLUB バニー・滋賀県・ソープ部門）", () => {
  it("既存のCLUB バニー（滋賀県）に1名追加。バッジ未確認のため unverified", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0060")!;
    expect(rec.storeId).toBe("mh26-nat-store-8ec15ee288b2d376");
    expect(rec.confidence).toBe("unverified");
    expect(rec.categoryOriginal).toBe("ソープ部門");
    expect(site.entrants.filter((e) => e.name === "ヨル")).toHaveLength(1);
  });
});

describe("掲載依頼（本人）：れいこ（ラブマシーン広島・広島県・デリヘル部門）", () => {
  it("広島県の新しい1店舗1名。バッジ確認（probable）。店舗ページURLは推測しない", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0015")!;
    expect(store.name).toBe("ラブマシーン広島");
    expect(store.prefectureName).toBe("広島県");
    expect(store.storePublicUrl ?? null).toBeNull();
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name)).toEqual(["れいこ"]);
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0061")!;
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("デリヘル部門");
  });
});

describe("掲載依頼：まどか（ガーデン-人妻ダイスキ-）・愛理（グランドオペラ東京）", () => {
  it("まどか：既存のガーデン（愛知県）に追加。バッジ確認（probable）。同名の別人とは別", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0062")!;
    expect(rec.storeId).toBe("mh26-nat-store-44836c2248dded79");
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("尾張部門");
  });
  it("愛理：東京都の新しい1店舗1名。unverified。愛知・神奈川のグランドオペラとは別", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0016")!;
    expect(store.name).toBe("グランドオペラ東京");
    expect(store.prefectureName).toBe("東京都");
    expect(site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name)).toEqual(["愛理"]);
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0063")!;
    expect(rec.confidence).toBe("unverified");
    expect(rec.categoryOriginal).toBe("コスプレアイドル部門");
  });
});

describe("掲載依頼：ロイヤルフラッシュ（茨城県・土浦）の4人", () => {
  it("既存のロイヤルフラッシュに4人追加。部門は告知バナーの表記。同名の別店舗の人とは別", () => {
    const store = site.stores.find((s) => s.id === "mh26-nat-store-038556133163fde5")!;
    const names = site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name);
    for (const n of ["あみ", "さな", "すず", "かえで", "ゆいな"]) expect(names).toContain(n);
    for (const c of ["スタイル自慢部門", "土浦ソープ部門", "おっぱい自慢部門", "マッサージ得意部門"]) expect(store.categoryOriginals).toContain(c);
    for (const id of ["0064", "0065", "0066", "0067"]) expect(entrantUpdates.find((e) => e.entrantId === `mh26-ent-${id}`)!.confidence).toBe("probable");
  });
});

describe("掲載依頼：もも（白いぽっちゃりさん 錦糸町店・東京都・ぽっちゃり部門）", () => {
  it("既存の錦糸町店に1名追加。バッジ確認（probable）", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0068")!;
    expect(rec.storeId).toBe("mh26-nat-store-c18fd8f63c567d71");
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("ぽっちゃり部門");
    const store = site.stores.find((s) => s.id === rec.storeId)!;
    expect(site.entrants.filter((e) => e.storeId === store.id && e.name === "もも")).toHaveLength(1);
  });
});

describe("グループの公式ページから追加：リッチドールなんば（大阪府）の5人", () => {
  it("既存のリッチドールなんば店に5人。部門は告知の表記。probable", () => {
    const store = site.stores.find((s) => s.id === "mh26-p3b-store-d2207376dea2130e")!;
    expect(store.prefectureName).toBe("大阪府");
    const names = site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name).sort();
    expect(names).toEqual(["アルカ", "キラ", "クレハ", "コノミ", "ミオ"].sort());
    for (const c of ["100名店在籍部門", "尻フェチ部門", "ニューヒロイン部門", "くじら部門", "ギャル部門"]) expect(store.categoryOriginals).toContain(c);
    for (const id of ["0069", "0070", "0071", "0072", "0073"]) expect(entrantUpdates.find((e) => e.entrantId === `mh26-ent-${id}`)!.confidence).toBe("probable");
  });
});

describe("掲載依頼：にこ（花嫁）（Yシャツと私・東京都・ロリっ子部門）", () => {
  it("既存のYシャツと私（東京都）に1名追加。バッジ確認（probable）。同名の別店舗の人とは別", () => {
    const rec = entrantUpdates.find((e) => e.entrantId === "mh26-ent-0074")!;
    expect(rec.storeId).toBe("mh26-p3b-store-c7a3853697174bc1");
    expect(rec.confidence).toBe("probable");
    expect(rec.categoryOriginal).toBe("ロリっ子部門");
  });
});

describe("掲載依頼：Venus（埼玉県・大宮）の15人", () => {
  it("既存のVenusに15人追加。部門はバッジの表記。probable。登録済みの人は増やさない", () => {
    const store = site.stores.find((s) => s.id === "mh26-p3b-store-6324b842fadbf58a")!;
    const names = site.entrants.filter((e) => e.storeId === store.id).map((e) => e.name);
    for (const n of ["ほたる", "沙耶", "まひる", "しの", "桃香", "リズ", "ねむ", "こころ", "彩〜あや〜", "モナ", "うさぎ", "なつ", "えりか", "れあ", "つむぎ", "かな", "なごみ", "ひいらぎ", "心美"]) expect(names.filter((x) => x === n)).toHaveLength(1);
    for (const c of ["マッサージ得意部門", "ギャンブル大好き部門", "店長一押し部門", "大宮ソープ部門", "性格がドS部門"]) expect(store.categoryOriginals).toContain(c);
  });
});

describe("掲載依頼：大宮ソープ キュート（埼玉県）の15人", () => {
  it("埼玉県の新しい1店舗に15人。部門はバッジの表記。probable", () => {
    const store = site.stores.find((s) => s.id === "mh26-upd-store-0017")!;
    expect(store.name).toBe("大宮ソープ キュート");
    expect(store.prefectureName).toBe("埼玉県");
    expect(site.entrants.filter((e) => e.storeId === store.id)).toHaveLength(15);
    for (const c of ["大宮ソープ部門", "店長一押し部門", "おっぱい自慢部門", "スタイル自慢部門", "大食い部門"]) expect(store.categoryOriginals).toContain(c);
  });
});

describe("掲載依頼: れおな（NEW GENERATION・栃木県）", () => {
  it("店・人・部門が載り、確からしさは probable", () => {
    const store = site.stores.find((s) => s.name === "NEW GENERATION")!;
    expect(store.prefectureName).toBe("栃木県");
    const e = site.entrants.find((x) => x.storeId === store.id && x.name === "れおな")!;
    expect(e).toBeTruthy();
    expect(e.divisions.map((d) => d.categoryOriginal)).toContain("マッサージ得意部門");
    expect(store.categoryOriginals).toContain("マッサージ得意部門");
  });
});

describe("掲載依頼: あみち（横浜ジャパンクラブバニーラウンジ）", () => {
  it("既存の店に追加され、未確認として載る", () => {
    const store = site.stores.find((s) => s.name === "横浜ジャパンクラブバニーラウンジ")!;
    expect(store.prefectureName).toBe("神奈川県");
    const e = site.entrants.find((x) => x.storeId === store.id && x.name === "あみち")!;
    expect(e).toBeTruthy();
    expect(e.confidence).toBe("unverified");
    expect(e.divisions.map((d) => d.categoryOriginal)).toContain("横浜部門");
    expect(site.stores.filter((s) => s.name.includes("バニーラウンジ"))).toHaveLength(1);
  });
});

describe("掲載依頼: 蒼（紫蘭マダム・福岡県・人妻部門）", () => {
  it("既存の店に追加され、人妻部門で probable", () => {
    const store = site.stores.find((s) => s.name.includes("紫蘭マダム"))!;
    expect(store.prefectureName).toBe("福岡県");
    const e = site.entrants.find((x) => x.storeId === store.id && x.name.startsWith("蒼"))!;
    expect(e).toBeTruthy();
    expect(e.confidence).toBe("probable");
    expect(e.divisions.map((d) => d.categoryOriginal)).toContain("人妻部門");
  });
});

describe("掲載依頼: ぷりん（岡山市ちゃんこ・岡山県・巨乳部門）", () => {
  it("店と人と部門が載り、未確認", () => {
    const store = site.stores.find((s) => s.name === "岡山市ちゃんこ")!;
    expect(store.prefectureName).toBe("岡山県");
    const e = site.entrants.find((x) => x.storeId === store.id && x.name === "ぷりん")!;
    expect(e).toBeTruthy();
    expect(e.confidence).toBe("unverified");
    expect(e.divisions.map((d) => d.categoryOriginal)).toContain("巨乳部門");
  });
});

describe("掲載依頼: 天音とき（ミセス虎の穴）の確認を追加", () => {
  it("すでにいる出場者が、スクリーンショットで probable に上がる（重複しない）", () => {
    const store = site.stores.find((s) => s.name.startsWith("ミセス虎の穴"))!;
    const list = site.entrants.filter((x) => x.storeId === store.id && x.name === "天音とき");
    expect(list).toHaveLength(1);
    expect(list[0].confidence).toBe("probable");
    expect(list[0].divisions.map((d) => d.categoryOriginal)).toContain("ルックス部門");
  });
});

describe("掲載依頼: ゆめ（アイドル研究所・大阪府・撮影OK女子部門）", () => {
  it("店と人と部門が載り、probable", () => {
    const store = site.stores.find((s) => s.name === "アイドル研究所")!;
    expect(store.prefectureName).toBe("大阪府");
    const e = site.entrants.find((x) => x.storeId === store.id && x.name === "ゆめ")!;
    expect(e).toBeTruthy();
    expect(e.confidence).toBe("probable");
    expect(e.divisions.map((d) => d.categoryOriginal)).toContain("撮影OK女子部門");
  });
});

describe("掲載依頼: ZONE（兵庫県）の女の子一覧", () => {
  it("店と10人が載り、probable", () => {
    const store = site.stores.find((s) => s.name === "＆ZONE")!;
    expect(store.prefectureName).toBe("兵庫県");
    expect(site.stores.filter((s) => s.name === "ZONE")).toHaveLength(0);
    const list = site.entrants.filter((e) => e.storeId === store.id && e.confidence === "probable" && e.name !== "ももか");
    expect(list).toHaveLength(10);
    for (const e of list) expect(e.confidence).toBe("probable");
    for (const c of ["有名店部門", "兵庫泡姫部門", "極嬢部門", "感度抜群部門", "アイドルロリ部門", "巨乳部門", "癒し系部門", "店長オススメ部門"]) expect(store.categoryOriginals).toContain(c);
  });
});

describe("掲載依頼: ツバサ（キャンディ・鹿児島県・地元っ娘部門）", () => {
  it("店と人と部門が載り、probable", () => {
    const store = site.stores.find((s) => s.name === "キャンディ")!;
    expect(store.prefectureName).toBe("鹿児島県");
    const e = site.entrants.find((x) => x.storeId === store.id && x.name === "ツバサ")!;
    expect(e).toBeTruthy();
    expect(e.confidence).toBe("probable");
    expect(e.divisions.map((d) => d.categoryOriginal)).toContain("地元っ娘部門");
  });
});

describe("掲載依頼: 5人（福原・雄琴）。名前・店名・URLによる未確認", () => {
  it("5人が既存の店または新しい店に載り、すべて unverified", () => {
    const find = (store: string, name: string) => {
      const st = site.stores.find((s) => s.name.startsWith(store))!;
      return site.entrants.find((x) => x.storeId === st.id && x.name === name)!;
    };
    for (const [store, name] of [["The White", "りん"], ["The White", "はつこい"], ["モンテクラブ", "黒木みれい"], ["キューティースタイル", "夢乃ゆめ"], ["キュアル神戸", "汐美るる"]]) {
      const e = find(store, name);
      expect(e, `${store}/${name}`).toBeTruthy();
      expect(e.confidence).toBe("unverified");
    }
    expect(site.stores.find((s) => s.name === "モンテクラブ")!.prefectureName).toBe("兵庫県");
  });
});

describe("掲載依頼: モンテクラブ（兵庫県）の女の子一覧", () => {
  it("店が probable に上がり、バッジのある5人が載る。バッジのない黒木みれいは未確認のまま", () => {
    const store = site.stores.find((s) => s.name === "モンテクラブ")!;
    expect(store.confidence).toBe("probable");
    const by = (n: string) => site.entrants.find((e) => e.storeId === store.id && e.name === n)!;
    for (const [n, c] of [["南雲 さよ", "癒し系部門"], ["美竹 ゆりあ", "極嬢部門"], ["朝比奈 梨央", "店長オススメ部門"], ["桜坂 しずく", "パイパン部門"], ["神原 みのり", "巨乳部門"]]) {
      expect(by(n).confidence).toBe("probable");
      expect(by(n).divisions.map((d) => d.categoryOriginal)).toContain(c);
    }
    expect(by("黒木みれい").confidence).toBe("unverified");
  });
});

describe("Xの公開投稿の調査（2026-11-12）：29人を未確認で追加", () => {
  it("既存の店と新しい店に載り、すべて unverified。重複しない", () => {
    const pairs: [string, string][] = [
      ["プロフィール大阪", "れん"], ["プロフィール大阪", "初花"], ["プロフィール大阪", "きさき"],
      ["Quality Plus横浜", "まいか"], ["Quality Plus横浜", "ましろ"], ["Masquerade", "めろ"], ["Babel CLASS", "いと"],
      ["クラブピア熊本", "すぎもっと"], ["さくらんぼ女学院", "らむ"], ["大阪フェチクラブ", "るい"], ["桜色学園", "るあ"], ["サキュバススタイル", "Succubus"],
    ];
    for (const [store, name] of pairs) {
      const st = site.stores.find((s) => s.name === store);
      expect(st, store).toBeTruthy();
      const list = site.entrants.filter((e) => e.storeId === st!.id && e.name === name);
      expect(list, `${store}/${name}`).toHaveLength(1);
      expect(list[0].confidence).toBe("unverified");
    }
    expect(site.stores.find((s) => s.name === "さくらんぼ女学院")!.prefectureName).toBe("岡山県");
    const osaka = site.stores.find((s) => s.name === "プロフィール大阪")!;
    expect(site.entrants.filter((e) => e.storeId === osaka.id && e.divisions.some((d) => d.categoryOriginal === "大阪府アイドル部門")).length).toBeGreaterThanOrEqual(15);
  });
});

describe("プロフィールのリンクの調査（2026-11-12）：24人を未確認で追加", () => {
  it("人と店が載り、すべて unverified", () => {
    const pairs: [string, string][] = [["GALAXY PLUS", "きらら"], ["エンジェルマスカット", "まひろ"], ["俺の妻", "せつな"], ["川崎ソープ SAPPHIRE サファイア", "ギンガ"], ["F＆J", "れんか"], ["BLUE LOVERS", "ちはる"], ["Crest", "菜月"], ["アムール", "カナデ"]];
    for (const [store, name] of pairs) {
      const st = site.stores.find((s) => s.name.startsWith(store));
      expect(st, store).toBeTruthy();
      const e = site.entrants.find((x) => x.storeId === st!.id && x.name === name);
      expect(e, `${store}/${name}`).toBeTruthy();
      expect(e!.confidence).toBe("unverified");
    }
    expect(site.stores.find((s) => s.name === "BLUE LOVERS")!.prefectureName).toBe("岐阜県");
  });
});
