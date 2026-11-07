import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__title" aria-label="VOTE VOTE VOTE 非公式全国情報まとめ トップ">
          <span className="site-header__logo">VOTE<br />VOTE<br />VOTE<span aria-hidden="true">♫</span></span>
          <span className="site-header__identity">
            <span className="site-header__badge">非公式</span>
            <span className="site-header__name">ミスヘブン総選挙2026 全国情報まとめ</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="メインメニュー">
          <Link href="/" className="site-nav__home">⌂ <span>ホーム</span></Link>
          <Link href="/search">♡ <span>推しを探す</span></Link>
          <Link href="/feature" className="site-nav__feature">特集</Link>
          <Link href="/categories">♕ <span>部門から探す</span></Link>
          <Link href="/#map">♧ <span>全国マップ</span></Link>
          <Link href="/search?kind=store">▣ <span>店舗情報</span></Link>
          <Link href="/about">ⓘ <span>このサイト</span></Link>
        </nav>
      </div>
    </header>
  );
}
