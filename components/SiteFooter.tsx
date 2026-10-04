import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          本サイトは有志による<strong>非公式</strong>の情報整理サイトです。ミスヘブン総選挙の主催者・公式サイト・掲載店舗とは一切関係ありません。
        </p>
        <p>
          掲載情報には未確認の調査候補が含まれます。正確な情報は必ず各確認元（公式・店舗・本人）でご確認ください。
        </p>
        <p>
          <Link href="/about">このサイトについて・確認状態の説明</Link>
        </p>
      </div>
    </footer>
  );
}
