/**
 * 外部リンクとして安全に表示できるURLだけを返す。
 * http / https 以外（javascript: data: 等）や不正な文字列は null。
 */
export function safeExternalUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!url.hostname) return null;
  return url.toString();
}

/** 表示用のホスト名（例: "example.com"） */
export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
