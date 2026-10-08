import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";
import { sourceUpdates, storeListingAreaUpdates, storePublicUrlUpdates, storeUpdates } from "@/data/store-updates";
import { entrantSources, entrantUpdates } from "@/data/entrant-updates";

/** 全国展開・仕上げPhase（2026-10-06）で追加した店舗・地域/URLの補完・出場者 */
describe("全国展開：店舗", () => {
  const added = storeUpdates.filter((s) => /^mh26-(nat|fin|disc)-store-/.test(s.storeId));
  const norm = (s: string) => s.normalize("NFKC").replace(/\s/g, "").toLowerCase();

  it("追加店舗は、ヘブンの店舗キーと一致する公開ページURL・同じ店舗キーの情報源を持ち、正式選挙エリアを持たない", () => {
    for (const s of added) {
      expect(s.storePublicUrl).toBe(`https://www.cityheaven.net/${s.cityheavenKey}/`);
      expect(s.formalElectionArea).toBeNull();
      expect(s.confidence).toBe(Number(s.evidencePageCount ?? 0) >= 2 ? "probable" : "unverified");
      expect(s.sourceIds.length).toBe(Number(s.evidencePageCount));
      for (const sid of s.sourceIds) {
        const src = sourceUpdates.find((x) => x.sourceId === sid)!;
        expect(src.storeIds).toContain(s.storeId);
        expect(`${src.url}/`).toContain(`/${s.cityheavenKey}/`);
        expect(src.url).not.toContain("?");
      }
    }
  });

  it("既存の店舗（同じ県・同じ店名）と重複しない", () => {
    for (const s of added) {
      const same = site.stores.filter((o) => o.id !== s.storeId && o.prefectureName === s.prefecture && norm(o.name) === norm(s.storeName));
      expect(same, s.storeId).toEqual([]);
    }
  });

  it("既存店舗の掲載地域・URLの補完は、同じ店舗キーのページを根拠にしている", () => {
    for (const u of [...storeListingAreaUpdates, ...storePublicUrlUpdates]) {
      for (const sid of u.sourceIds) {
        const src = sourceUpdates.find((x) => x.sourceId === sid)!;
        expect(src.storeIds).toContain(u.storeId);
      }
    }
    for (const u of storePublicUrlUpdates.filter((x) => x.sourceIds.some((s) => /^(nat|fin|disc)-src-/.test(s)))) {
      const src = sourceUpdates.find((x) => x.sourceId === u.sourceIds[0])!;
      expect(src.url.replace("smart.cityheaven", "www.cityheaven").startsWith(u.storePublicUrl)).toBe(true);
    }
  });
});

describe("全国展開：出場者", () => {
  const added = entrantUpdates.filter((e) => /^mh26-ent-[nf]-/.test(e.entrantId));

  it("根拠に2026年（または2026年の日付）があり、情報源はその店舗のもの・個人URLは入れない", () => {
    for (const e of added) {
      expect(e.evidence.includes("2026") || /^2026-(08|09|10)-/.test(e.evidenceDate ?? ""), e.entrantId).toBe(true);
      expect(e.personalUrl ?? null).toBeNull();
      for (const sid of e.sourceIds) expect(entrantSources.find((s) => s.sourceId === sid)!.storeIds).toContain(e.storeId);
    }
  });

  it("部門は原文どおり「…部門」で、その店舗の部門として表示される", () => {
    for (const e of added.filter((x) => x.categoryOriginal)) {
      expect(e.categoryOriginal!.endsWith("部門")).toBe(true);
      expect(site.stores.find((s) => s.id === e.storeId)!.categoryOriginals, e.entrantId).toContain(e.categoryOriginal);
    }
  });

  it("同じ店舗・同じ名前の出場者は1人だけ（別の店舗の同名は別人として扱う）", () => {
    const seen = new Set<string>();
    for (const e of entrantUpdates) {
      const k = `${e.storeId}|${e.name.normalize("NFKC").replace(/[\s☆★♡()（）・]/g, "").toLowerCase()}`;
      expect(seen.has(k), e.entrantId).toBe(false);
      seen.add(k);
    }
  });
});

describe("追加した情報源URL", () => {
  it("ヘブンの情報源URLに、セッションID・表示モードなどの不要なクエリを含めない（ページを特定する girlId は残す）", () => {
    // 手で入れた初期の情報源（利用者提供のabc＋のURLなど）は対象外。調査で追加した分（パイロット・全国展開・仕上げ）を確認する
    const urls = [...sourceUpdates, ...entrantSources]
      .filter((s) => !/^(upd-src-|ent-src-00)/.test(s.sourceId))
      .map((s) => s.url)
      .filter((u) => u.includes("cityheaven.net"));
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) expect(u, u).not.toMatch(/[?&](spmode|pcmode|lo|of|rk|PHPSESSID)=|#!/);
  });
});
