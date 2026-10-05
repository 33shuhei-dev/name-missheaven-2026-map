import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          本サイトは有志による<strong>非公式</strong>の情報まとめです。ミスヘブン総選挙の主催者・公式サイト・掲載店舗・出場者とは関係ありません。
        </p>
        <p>
          公開情報から確認できた範囲を整理したもので、全出場者・全部門の網羅を保証するものではありません。最新・正確な情報は各情報源でご確認ください。
        </p>
        <p className="site-footer__links">
          <Link href="/about">このサイトについて</Link>
        </p>
        <p className="site-footer__credit">地図：国土地理院「地球地図日本」をもとに jpn-atlas（BSD-3-Clause）を加工して作成</p>
      </div>
    </footer>
  );
}
