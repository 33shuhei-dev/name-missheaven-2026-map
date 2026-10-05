/**
 * 日本語検索用の文字列正規化。
 *
 * - NFKC（全角英数→半角、半角カナ→全角カナ 等）
 * - 英字は小文字化
 * - カタカナ → ひらがな（「イチオシ」と「いちおし」を同一視）
 * - 区切り記号・装飾記号・空白を除去（「美尻・美脚」と「美尻美脚」を同一視）
 *
 * 表示用の文字列は変更しない。検索・比較の内部キーにだけ使う。
 */
const IGNORED_CHARS = /[\s・･/／、，,.。:：;；!！?？~～〜♡♥❤♪☆★◆◇■□●○※'"`’”「」『』（）()［］[\]【】〔〕{}｛｝<>＜＞\-‐－_＿|｜+＋&＆#＃*＊]/g;

export function normalizeForSearch(input: string | undefined | null): string {
  if (!input) return "";
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(IGNORED_CHARS, "");
}

/** 検索語を空白（全角含む）で分割し、正規化済みトークンの配列を返す */
export function tokenizeQuery(query: string | undefined | null): string[] {
  if (!query) return [];
  return query
    .normalize("NFKC")
    .split(/\s+/)
    .map(normalizeForSearch)
    .filter((t) => t.length > 0);
}

/** 日本語ロケールでの比較（一覧の並び順用） */
export function compareJa(a: string, b: string): number {
  return a.localeCompare(b, "ja");
}
