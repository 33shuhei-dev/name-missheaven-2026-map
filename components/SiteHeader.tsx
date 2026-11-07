import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__title" aria-label="VOTE VOTE VOTE 非公式全国情報まとめ トップ">
          <span className="site-header__logo">VOTE<br />VOTE<br />VOTE<span aria-hidden="true">♫</span></span>
          <span className="site-header__badge">非公式</span>
        </Link>
        <nav className="site-nav" aria-label="メインメニュー">
          <Link href="/">⌂ <span>ホーム</span></Link>
          <Link href="/categories">♕ <span>部門から探す</span></Link>
          <Link href="/#map">♧ <span>全国マップ</span></Link>
          <Link href="/search?kind=store">▣ <span>店舗情報</span></Link>
          <Link href="/feature" className="site-nav__feature">特集</Link>
          <Link href="/about">ⓘ <span>このサイト</span></Link>
        </nav>
        <Link href="/search" className="site-header__find">♡ <span>推しを探す</span></Link>
      </div>
    </header>
  );
}
