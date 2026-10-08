import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { buildSearchIndex, searchItems } from "@/lib/search";
import { entrantSources, entrantUpdates } from "@/data/entrant-updates";
import { sourceUpdates, storeUpdates } from "@/data/store-updates";
import { PUBLISHER_ROLE_LABEL, participationStatusText } from "@/lib/labels";

/** 本人SNSの出場表明を検索で見つけて追加した出場者・店舗（本人からの掲載申請ではない） */
describe("本人SNSで出場確認（検索で発見）", () => {
  const ents = entrantUpdates.filter((e) => e.entrantId.startsWith("mh26-ent-s-"));
  const stores = storeUpdates.filter((s) => s.storeId.startsWith("mh26-sns-store-"));

  it("追加されている", () => {
    expect(ents.length).toBeGreaterThan(0);
  });

  it("出場者：根拠に2026年があり、情報源は本人のX、記録には「本人申請」と書かない（掲載申請とは区別）", () => {
    for (const e of ents) {
      expect(e.evidence, e.entrantId).toContain("2026");
      expect(e.notes, e.entrantId).toContain("本人SNSで出場確認");
      expect(e.notes, e.entrantId).toContain("本人からの掲載申請ではない");
      expect(e.notes ?? "", e.entrantId).not.toContain("本人申請を起点に追加");
      for (const sid of e.sourceIds) {
        const src = entrantSources.find((s) => s.sourceId === sid)!;
        expect(src.url).toMatch(/^https:\/\/x\.com\//);
        expect(src.url).not.toContain("?");
        expect(src.publisherRole).toBe("entrant_social_found");
        expect(src.notes).toContain("本人からの掲載申請ではなく");
        expect(src.storeIds).toContain(e.storeId);
      }
    }
  });

  it("部門は原文のまま「…部門」。店舗×部門のrelationは同じ情報源で裏付けがある", () => {
    for (const e of ents.filter((x) => x.categoryOriginal)) {
      expect(e.categoryOriginal!.endsWith("部門"), e.entrantId).toBe(true);
      expect(site.stores.find((s) => s.id === e.storeId)!.categoryOriginals, e.entrantId).toContain(e.categoryOriginal);
    }
  });

  it("新規店舗：都道府県あり、正式選挙エリアなし、公開ページURLは店舗キーがあるときだけ（推測しない）。「本人申請」用の文言ではない", () => {
    for (const s of stores) {
      expect(s.prefecture).toBeTruthy();
      expect(s.formalElectionArea).toBeNull();
      expect(s.participationType).toBe("entrant_sns_reported");
      if (s.cityheavenKey) expect(s.storePublicUrl).toBe(`https://www.cityheaven.net/${s.cityheavenKey}/`);
      else expect(s.storePublicUrl).toBeNull();
      expect(s.notes).toContain("本人からの掲載申請ではない");
      for (const sid of s.sourceIds) expect(sourceUpdates.find((x) => x.sourceId === sid)!.storeIds).toContain(s.storeId);
      const view = site.stores.find((x) => x.id === s.storeId)!;
      expect(participationStatusText(view)).toContain("本人からの申請ではありません");
      expect(participationStatusText(view)).not.toContain("本人からの掲載申請があり");
    }
    expect(PUBLISHER_ROLE_LABEL["entrant_social_found"]).toContain("申請ではない");
  });

  it("追加した出場者は検索で先頭に出て、所属店舗のページへ進める。同じ店舗・同じ名前の重複はない", () => {
    const items = buildSearchIndex(site);
    const seen = new Set<string>();
    for (const e of ents) {
      const k = `${e.storeId}|${e.name.normalize("NFKC").replace(/[\s☆★♡()（）・]/g, "").toLowerCase()}`;
      expect(seen.has(k), e.entrantId).toBe(false);
      seen.add(k);
      const hits = searchItems(items, { q: e.name, kind: "entrant" });
      expect(hits.some((h) => h.item.href.startsWith(`/store/${e.storeId}#`)), e.entrantId).toBe(true);
    }
  });
});
