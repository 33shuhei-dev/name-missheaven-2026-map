import { describe, expect, it } from "vitest";
import { SCHEDULE, currentStatus } from "@/lib/schedule";

describe("大会の日程（出典の表記どおり）と、いまの期間", () => {
  it("地方予選・ブロック本選の期間（日本時間）", () => {
    expect(SCHEDULE.map((p) => [p.start, p.end])).toEqual([
      ["2026-10-28T12:00:00+09:00", "2026-11-04T12:00:00+09:00"],
      ["2026-11-17T12:00:00+09:00", "2026-11-24T12:00:00+09:00"],
    ]);
  });
  it("時刻に応じた状況", () => {
    expect(currentStatus(new Date("2026-10-27T12:00:00+09:00")).text).toContain("まもなく地方予選");
    expect(currentStatus(new Date("2026-10-28T12:00:00+09:00")).phaseId).toBe("local");
    expect(currentStatus(new Date("2026-11-04T12:00:00+09:00")).text).toContain("地方予選は終了");
    expect(currentStatus(new Date("2026-11-20T00:00:00+09:00")).phaseId).toBe("block");
    expect(currentStatus(new Date("2026-11-24T12:00:00+09:00")).text).toContain("グランプリ");
  });
});
