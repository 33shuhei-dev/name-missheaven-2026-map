import { ExternalLink } from "@/components/ExternalLink";

/** 運営者（有志）個人の応援ツール。計測用パラメータは付けない */
export const YUZU_SUPPORT_URL = "https://yuzu-gakari.vercel.app/";

const NOTE =
  "このサイトの運営者（有志）個人の応援活動へのリンクです。このサイトに掲載している情報とは別のもので、掲載内容の確かさや順位とは関係ありません。";

/** 特集ページの末尾に置く、小さな案内 */
export function YuzuSupportNote() {
  return (
    <aside className="section card prose yuzu-support" aria-label="運営者の応援ツール">
      <h2>運営者の応援ツール</h2>
      <p>{NOTE}</p>
      <p>
        <ExternalLink href={YUZU_SUPPORT_URL} label="ゆず係｜応援団員証をつくる" />
      </p>
    </aside>
  );
}

/** フッター用の1行 */
export function YuzuSupportFooterLine() {
  return (
    <p className="site-footer__links">
      運営者個人の応援ツール：
      <a href={YUZU_SUPPORT_URL} target="_blank" rel="noopener noreferrer nofollow ugc">
        ゆず係｜応援団員証
      </a>
      （当サイトの掲載情報とは別です）
    </p>
  );
}
