import { describe, expect, it } from "vitest";
import { site } from "@/lib/data";

/** 更新依頼（本人）：櫻井 玲子（白夜・東京都・高級部門）。部門は既に登録済み。本人のページのURLを、人物の行から辿れるようにした */
describe("更新依頼：櫻井 玲子（白夜・東京都）", () => {
  const e = site.entrants.find((x) => x.name === "櫻井 玲子")!;

  it("1人だけ登録されていて、部門は高級部門、白夜（東京都）に紐づく", () => {
    expect(site.entrants.filter((x) => x.name === "櫻井 玲子")).toHaveLength(1);
    expect(e.divisions.map((d) => d.categoryOriginal)).toContain("高級部門");
    const store = site.stores.find((s) => s.id === e.storeId)!;
    expect(store.name).toBe("白夜");
    expect(store.prefectureName).toBe("東京都");
    expect(store.storePublicUrl).toBe("https://www.cityheaven.net/tokyo/A1311/A131101/byakuya/");
  });

  it("本人のページのURL（依頼で提供）が設定されている", () => {
    expect(e.entrantRecord?.personalUrl).toBe("https://www.cityheaven.net/tokyo/A1311/A131101/byakuya/girlid-44187678/");
  });
});
