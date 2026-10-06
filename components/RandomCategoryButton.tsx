"use client";

import { useRouter } from "next/navigation";

/** 部門をランダムに1つ開く。候補はページ側でデータから渡す（部門ページまたは部門一覧の該当部門） */
export function RandomCategoryButton({ hrefs, label = "部門をランダムに見る" }: { hrefs: string[]; label?: string }) {
  const router = useRouter();
  if (hrefs.length === 0) return null;
  return (
    <button
      type="button"
      className="random-cat"
      onClick={() => {
        // いま見ている部門は選ばない（押しても変わらない、を避ける）
        const here = window.location.pathname + window.location.search;
        const pool = hrefs.length > 1 ? hrefs.filter((h) => h !== here) : hrefs;
        router.push(pool[Math.floor(Math.random() * pool.length)]);
      }}
    >
      <span aria-hidden="true">🎲</span> {label}
    </button>
  );
}
