import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { entrantSources, entrantUpdates } from "@/data/entrant-updates";
import { sourceUpdates, storeUpdates } from "@/data/store-updates";
import { PARTICIPATION_TYPE_LABEL, PUBLISHER_ROLE_LABEL, STORE_CONFIDENCE_DESCRIPTION, participationStatusText } from "@/lib/labels";

/** 本人申請を起点に個別追加した出場者（恋仲めい / AMOR-アモル- / 福岡県 / 福岡県フリースタイル部門） */
describe("本人申請：恋仲めい（AMOR-アモル-・福岡県・福岡県フリースタイル部門）", () => {
  const CAT = "福岡県フリースタイル部門";
  const items = buildSearchIndex(site);
  const store = site.stores.find((s) => s.name === "AMOR-アモル-")!;

  it("店舗・出場者は1件ずつだけ登録されている（重複なし）", () => {
    expect(site.stores.filter((s) => s.name === "AMOR-アモル-")).toHaveLength(1);
    expect(site.entrants.filter((e) => e.name === "恋仲めい")).toHaveLength(1);
    expect(entrantUpdates.filter((e) => e.name === "恋仲めい")).toHaveLength(1);
    expect(storeUpdates.filter((s) => s.storeName === "AMOR-アモル-")).toHaveLength(1);
  });

  it("店舗は福岡県。掲載地域・公開ページURL・正式選挙エリアは推測せず未設定", () => {
    expect(store.prefectureName).toBe("福岡県");
    expect(store.listingAreas).toEqual([]);
    expect(store.storePublicUrl).toBeUndefined();
    expect(store.formalElectionArea).toBeUndefined();
  });

  it("出場者は店舗に紐づき、部門は原文のまま、本人Xは個人URL（任意項目）として記録している", () => {
    const e = site.entrants.find((x) => x.name === "恋仲めい")!;
    expect(e.storeId).toBe(store.id);
    const rec = entrantUpdates.find((x) => x.name === "恋仲めい")!;
    expect(rec.categoryOriginal).toBe(CAT);
    expect(rec.personalUrl).toBe("https://x.com/princess1224mei");
    expect(rec.evidence).toContain("2026年10月6日");
    expect(rec.evidence).toContain("『福岡県フリースタイル部門』で出場します");
  });

  it("本人申請を起点に追加したことが、記録・情報源・店舗に残っている", () => {
    const rec = entrantUpdates.find((x) => x.name === "恋仲めい")!;
    expect(rec.notes).toContain("本人申請を起点に追加");
    for (const sid of rec.sourceIds) expect(entrantSources.find((s) => s.sourceId === sid)!.notes).toContain("本人申請を起点に追加");
    expect(storeUpdates.find((s) => s.storeName === "AMOR-アモル-")!.notes).toContain("本人申請を起点に追加");
    expect(sourceUpdates.find((s) => s.storeIds.includes(store.id))!.notes).toContain("本人申請を起点に追加");
  });

  it("「恋仲めい」の検索で出場者が先頭に出て、店舗ページへ進める", () => {
    const hits = searchItems(items, { q: "恋仲めい" });
    expect(hits[0].item.kind).toBe("entrant");
    expect(hits[0].item.href.startsWith(`/store/${store.id}`)).toBe(true);
    expect(hits[0].item.prefName).toBe("福岡県");
    expect(hits[0].item.sub).toContain("AMOR-アモル-");
    expect(hits[0].item.sub).toContain(CAT);
  });

  it("店舗名・福岡県・部門名の検索からも辿れる", () => {
    expect(searchItems(items, { q: "AMOR-アモル-", kind: "store" }).some((h) => h.item.href === `/store/${store.id}`)).toBe(true);
    expect(searchItems(items, { q: "恋仲めい", pref: "fukuoka" }).some((h) => h.item.kind === "entrant")).toBe(true);
    expect(searchItems(items, { q: CAT, kind: "division" }).length).toBeGreaterThan(0);
  });

  it("福岡県の「福岡県フリースタイル部門」に店舗が入り、店舗の部門にも原文のまま出る（別名に統合しない）", () => {
    const divs = site.divisions.filter((d) => d.categoryOriginal === CAT && d.prefSlug === "fukuoka");
    expect(divs.length).toBeGreaterThan(0);
    expect(divs.some((d) => d.stores.some((s) => s.id === store.id))).toBe(true);
    expect(store.categories.map((c) => c.categoryOriginal)).toEqual([CAT]);
    expect(site.categories.flatMap((g) => g.names.map((n) => n.name)).filter((n) => n === CAT)).toHaveLength(1);
  });
});

/** 「参加情報の根拠」の説明文：本人申請・本人SNSで確認した店舗だけ文言を変え、既存店舗は従来どおり */
describe("店舗ページの参加情報の説明文", () => {
  // 従来の表示（変更前の式）
  const legacy = (s: { participationType: string; confidence: "confirmed" | "probable" | "unverified"; verificationMethod?: string }) =>
    s.verificationMethod
      ? STORE_CONFIDENCE_DESCRIPTION[s.confidence]
      : `${PARTICIPATION_TYPE_LABEL[s.participationType] ?? "参加関連の根拠あり"}。${STORE_CONFIDENCE_DESCRIPTION[s.confidence]}`;

  it("AMOR-アモル- には、本人申請・本人SNSでの確認に合った説明を表示する", () => {
    const s = site.stores.find((x) => x.name === "AMOR-アモル-")!;
    expect(participationStatusText(s)).toBe("本人からの掲載申請があり、本人のSNS投稿で2026年の出場表明を確認した店舗です。");
    expect(participationStatusText(s)).not.toContain("検索結果");
  });

  it("本人申請で追加した店舗以外のすべての店舗で、説明文は従来と同じ", () => {
    const others = site.stores.filter((s) => s.participationType !== "entrant_self_reported");
    expect(others.length).toBe(site.stores.length - 1);
    for (const s of others) expect(participationStatusText(s), s.id).toBe(legacy(s));
  });

  it("信頼度ごとの説明文（バッジ・「このサイトについて」で使う共通の文）は変えていない", () => {
    expect(STORE_CONFIDENCE_DESCRIPTION.unverified).toContain("店舗ページの検索結果などで");
    expect(STORE_CONFIDENCE_DESCRIPTION.probable).toContain("複数確認した店舗です");
  });

  it("情報源の役割は、本人のSNS投稿として表示される", () => {
    expect(PUBLISHER_ROLE_LABEL["entrant_social_post"]).toBe("出場者本人のSNS投稿（本人申請）");
    for (const id of ["upd-src-0003", "ent-src-0023"]) {
      const src = [...sourceUpdates, ...entrantSources].find((x) => x.sourceId === id)!;
      expect(src.publisherRole).toBe("entrant_social_post");
    }
  });
});
