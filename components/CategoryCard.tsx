import Link from "next/link";

/** 部門カード：部門名 ＋ 店舗数・都道府県数だけ。カード全体がリンク */
export function CategoryCard({ row }: { row: { name: string; storeCount: number; prefectureCount: number; href: string } }) {
  return (
    <Link href={row.href} className="cat-card">
      <span className="cat-card__name">{row.name}</span>
      <span className="cat-card__meta">
        {row.storeCount > 0 ? `${row.storeCount}店` : "店舗は未判明"}
        {row.prefectureCount > 0 && ` ・ ${row.prefectureCount}都道府県`}
        <span aria-hidden="true"> ›</span>
      </span>
    </Link>
  );
}
