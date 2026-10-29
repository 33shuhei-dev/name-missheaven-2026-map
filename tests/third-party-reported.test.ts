import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { entrantSources, entrantUpdates } from "@/data/entrant-updates";
import { sourceUpdates, storeUpdates } from "@/data/store-updates";
import { PUBLISHER_ROLE_LABEL, participationStatusText } from "@/lib/labels";

/**
 * 店舗・第三者（ファンなど）の投稿を根拠に追加した出場者と、都道府県が分からない店舗（2026-10-29 の運営判断）。
 * 出場者本人の投稿ではないことと、未確認であることを、記録と画面の説明文に明記する。
 */
describe("店舗・第三者の投稿を根拠にした出場者", () => {
  const ents = entrantUpdates.filter((e) => e.entrantId.startsWith("mh26-ent-t-"));

  it("出場者：未確認で、出場者本人の投稿ではないと明記。個人URLなし。根拠は2026年の記載か投稿日", () => {
    for (const e of ents) {
      expect(e.confidence, e.entrantId).toBe("unverified");
      expect(e.evidence, e.entrantId).toContain("出場者本人の投稿ではない");
      expect(e.notes, e.entrantId).toContain("出場者本人の投稿ではない");
      expect(e.personalUrl ?? null, e.entrantId).toBeNull();
      expect(e.evidence.includes("2026") || !!e.evidenceDate, e.entrantId).toBe(true);
      for (const sid of e.sourceIds) {
        const src = entrantSources.find((s) => s.sourceId === sid)!;
        expect(src.url).toMatch(/^https:\/\/x\.com\//);
        expect(["store_announcement", "third_party_social_found"]).toContain(src.publisherRole);
        expect(src.notes).toContain("出場者本人の投稿ではなく");
        expect(src.storeIds).toContain(e.storeId);
      }
    }
  });

  it("店舗（第三者の投稿が根拠）：説明文に「出場者本人の投稿ではなく、未確認」と出る。都道府県が不明な店舗は「地域未判明」", () => {
    const stores = storeUpdates.filter((s) => s.participationType === "third_party_reported");
    for (const s of stores) {
      expect(s.confidence).toBe("unverified");
      expect(s.notes).toContain("出場者本人の投稿ではない");
      for (const sid of s.sourceIds) expect(sourceUpdates.find((x) => x.sourceId === sid)!.storeIds).toContain(s.storeId);
      const view = site.stores.find((x) => x.id === s.storeId)!;
      expect(participationStatusText(view)).toContain("出場者本人の投稿ではなく、未確認");
    }
    for (const s of storeUpdates.filter((x) => x.storeId.startsWith("mh26-hv-store-"))) {
      expect(s.prefecture).toBeNull();
      expect(site.stores.find((x) => x.id === s.storeId)!.prefSlug).toBe("unknown");
    }
    expect(PUBLISHER_ROLE_LABEL["third_party_social_found"]).toContain("本人の投稿ではない");
  });

  it("追加した出場者は、同じ店舗・同じ名前の重複がない", () => {
    const seen = new Set<string>();
    for (const e of entrantUpdates.filter((x) => /^mh26-ent-[ht]-/.test(x.entrantId))) {
      const k = `${e.storeId}|${e.name.normalize("NFKC").replace(/[\s☆★♡()（）・]/g, "").toLowerCase()}`;
      expect(seen.has(k), e.entrantId).toBe(false);
      seen.add(k);
    }
  });
});
