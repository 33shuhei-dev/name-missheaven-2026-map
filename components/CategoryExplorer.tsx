"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeForSearch, tokenizeQuery } from "@/lib/text";
import { RARE_MAX_STORES } from "@/lib/categories";
import { CategoryCard } from "./CategoryCard";

export interface CategoryRow {
  name: string;
  /** 表記が似ている別の部門名（同一とは確認していない） */
  variants: string[];
  keys: string[];
  /** この部門名に関係する店舗数（店舗×部門関係の店舗IDの重複なし） */
  storeCount: number;
  /** この部門名の情報がある都道府県（地域未判明を含むことがある） */
  prefectures: { slug: string; label: string }[];
  /** 情報が見つかった都道府県の数（地域未判明は数えない） */
  prefectureCount: number;
  /** カードのリンク先（部門が1か所ならその部門ページ、複数ならこの一覧でその部門名を開く） */
  href: string;
  divisions: { id: string; label: string; storeCount: number }[];
}

/** 一覧の切替。部門名を意味で分類せず、店舗数・都道府県数だけで並べ替え・絞り込む */
type View = "all" | "many" | "wide" | "rare";

/** 「店舗が多い」：このサイトで見つかった店舗がこの数以上の部門 */
const MANY_MIN_STORES = 3;

const VIEWS: { id: View; label: string; note?: string }[] = [
  { id: "all", label: "全部" },
  { id: "many", label: "店舗が多い", note: `このサイトで見つかった店舗が${MANY_MIN_STORES}店以上の部門を、多い順に並べています。` },
  { id: "wide", label: "全国に広い", note: "2つ以上の都道府県で見つかった部門を、都道府県が多い順に並べています。" },
  {
    id: "rare",
    label: "レア",
    note: `このサイトで見つかった店舗が1〜${RARE_MAX_STORES}店の部門です（公式に珍しい部門という意味ではありません）。`,
  },
];

/** URL の ?q=（部門カードから来たとき）を初期値にする。読み込み前は q なしで全件を描画する */
export function CategoryExplorerWithParams(props: { rows: CategoryRow[]; prefOptions: { slug: string; label: string }[] }) {
  const q = useSearchParams().get("q") ?? "";
  return <CategoryExplorer key={q} {...props} initialQ={q} />;
}

export function CategoryExplorer({
  rows,
  prefOptions,
  initialQ = "",
}: {
  rows: CategoryRow[];
  prefOptions: { slug: string; label: string }[];
  initialQ?: string;
}) {
  const [q, setQ] = useState(initialQ);
  const [pref, setPref] = useState("");
  const [view, setView] = useState<View>("all");

  const list = useMemo(() => {
    const tokens = tokenizeQuery(q);
    const exact = normalizeForSearch(q);
    const byName = (a: CategoryRow, b: CategoryRow) => a.name.localeCompare(b.name, "ja");
    const byStores = (a: CategoryRow, b: CategoryRow) => b.storeCount - a.storeCount || b.prefectureCount - a.prefectureCount || byName(a, b);
    const isExact = (r: CategoryRow) => (exact && normalizeForSearch(r.name) === exact ? 0 : 1);
    const filtered = rows.filter(
      (r) =>
        tokens.every((t) => r.keys.some((k) => k.includes(t))) &&
        (!pref || r.prefectures.some((p) => p.slug === pref)) &&
        (view === "many" ? r.storeCount >= MANY_MIN_STORES : view === "wide" ? r.prefectureCount >= 2 : view === "rare" ? r.storeCount >= 1 && r.storeCount <= RARE_MAX_STORES : true),
    );
    return filtered.sort(
      (a, b) =>
        isExact(a) - isExact(b) ||
        (view === "wide"
          ? b.prefectureCount - a.prefectureCount || b.storeCount - a.storeCount || byName(a, b)
          : view === "rare"
            ? byName(a, b)
            : byStores(a, b)),
    );
  }, [rows, q, pref, view]);

  // 部門名を指定して開いたとき（?q=部門名）は、その部門の地域をすべて見せる
  const focused = list.length > 0 && q && normalizeForSearch(list[0].name) === normalizeForSearch(q) ? list[0] : null;
  const currentView = VIEWS.find((v) => v.id === view)!;

  return (
    <>
      {focused && (
        <section className="card category-focus" aria-labelledby="focus-heading">
          <p className="eyebrow">部門</p>
          <h2 id="focus-heading" className="category-focus__name">
            {focused.name}
          </h2>
          <p className="category__meta">
            {focused.storeCount}店 ・ {focused.prefectureCount}都道府県
          </p>
          <p className="hint hint--tight">この部門がある地域です。タップすると店舗を見られます。</p>
          <ul className="category__places">
            {focused.divisions.map((d) => (
              <li key={d.id}>
                <Link href={`/division/${d.id}`} className="place-link">
                  <span>{d.label}</span>
                  <span className="place-link__count">{d.storeCount > 0 ? `${d.storeCount}店 ›` : "›"}</span>
                </Link>
              </li>
            ))}
          </ul>
          {focused.variants.length > 0 && (
            <p className="category__variant">表記が似ている部門名：{focused.variants.join("、")}（同一とは確認していません）</p>
          )}
        </section>
      )}

      <div className="view-tabs" role="group" aria-label="部門の見方">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={v.id === view ? "view-tab view-tab--active" : "view-tab"}
            aria-pressed={v.id === view}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      {currentView.note && <p className="hint hint--tight">{currentView.note}</p>}

      <div className="search-panel search-panel--compact">
        <div className="field-row">
          <label className="field">
            <span className="field__label">部門名で探す</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="例：コスプレ"
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span className="field__label">都道府県</span>
            <select value={pref} onChange={(e) => setPref(e.target.value)}>
              <option value="">全国</option>
              {prefOptions.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {(q || pref) && (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => {
              setQ("");
              setPref("");
            }}
          >
            すべての部門を見る
          </button>
        )}
      </div>

      <h2 className="section">
        {q ? `「${q}」で探した部門` : `${currentView.label === "全部" ? "すべての部門" : currentView.label}`}
        <span className="count">{list.length}種類</span>
      </h2>
      {list.length === 0 ? (
        <p className="empty">条件に一致する部門名はありません。</p>
      ) : (
        <ul className="cat-grid">
          {list.map((r) => (
            <li key={r.name}>
              <CategoryCard row={r} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
