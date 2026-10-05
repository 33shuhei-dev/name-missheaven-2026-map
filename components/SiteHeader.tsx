import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__title">
          <span className="site-header__badge">非公式</span>
          <span className="site-header__name">ミスヘブン総選挙2026 全国情報まとめ</span>
        </Link>
        <nav className="site-nav" aria-label="メインメニュー">
          <Link href="/">全国地図</Link>
          <Link href="/search">検索</Link>
          <Link href="/categories">部門一覧</Link>
          <Link href="/about">このサイト</Link>
        </nav>
      </div>
    </header>
  );
}
