import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <h1>ページが見つかりません</h1>
      <p>URLが変更されたか、データが削除された可能性があります。</p>
      <p>
        <Link href="/" className="button">
          全国トップへ戻る
        </Link>
      </p>
    </section>
  );
}
