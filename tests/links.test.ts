import { describe, expect, it } from "vitest";
import { displayHost, safeExternalUrl } from "@/lib/links";

describe("safeExternalUrl", () => {
  it("http/https を許可する", () => {
    expect(safeExternalUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(safeExternalUrl(" http://example.com ")).toBe("http://example.com/");
  });
  it("危険・不正なURLを拒否する", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,x")).toBeNull();
    expect(safeExternalUrl("//example.com")).toBeNull();
    expect(safeExternalUrl("example.com")).toBeNull();
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
  });
  it("ホスト名を表示用に取り出す", () => {
    expect(displayHost("https://www.example.com/x")).toBe("example.com");
  });
});
