"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeForSearch, tokenizeQuery } from "@/lib/text";

export interface CategoryRow {
  name: string;
  /** 表記が似ている別の部門名（同一とは確認していない） */
  variants: string[];
  keys: string[];
  recordCount: number;
  /** この部門名に関係する店舗数（店舗×部門関係の店舗IDの重複なし） */
  storeCount: number;
  /** この部門名の情報がある都道府県（地域未判明を含むことがある） */
  prefectures: { slug: string; label: string }[];
  /** 情報が見つかった都道府県の数（地域未判明は数えない） */
  prefectureCount: number;
  divisions: { id: string; label: string; storeCount: number }[];
}

type Sort = "stores" | "prefs" | "name";

const PAGE_SIZE = 40;
/** 1つの部門名で最初に見せる地域の数（残りは「ほか」で開く）。一覧では短く、部門名で探したときは多めに */
const PLACE_PREVIEW = 2;
const PLACE_PREVIEW_SEARCH = 6;

/** URL の ?q=（トップの部門から来たとき）を初期値にする。読み込み前は q なしで全件を描画する */
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
  const [sort, setSort] = useState<Sort>("stores");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const list = useMemo(() => {
    const tokens = tokenizeQuery(q);
    const exact = normalizeForSearch(q);
    const filtered = rows.filter(
      (r) => tokens.every((t) => r.keys.some((k) => k.includes(t))) && (!pref || r.prefectures.some((p) => p.slug === pref)),
    );
    const byName = (a: CategoryRow, b: CategoryRow) => a.name.localeCompare(b.name, "ja");
    const isExact = (r: CategoryRow) => (exact && normalizeForSearch(r.name) === exact ? 0 : 1);
    return filtered.sort(
      (a, b) =>
        isExact(a) - isExact(b) ||
        (sort === "name"
          ? byName(a, b)
          : sort === "prefs"
            ? b.prefectureCount - a.prefectureCount || b.storeCount - a.storeCount || byName(a, b)
            : b.storeCount - a.storeCount || b.prefectureCount - a.prefectureCount || byName(a, b)),
    );
  }, [rows, q, pref, sort]);

  const reset = () => setLimit(PAGE_SIZE);
  const preview = q.trim() ? PLACE_PREVIEW_SEARCH : PLACE_PREVIEW;

  return (
    <>
      <div className="search-panel">
        <label className="field">
          <span className="field__label">部門名で探す</span>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              reset();
            }}
            placeholder="例：おっぱい、コスプレ、人妻"
            autoComplete="off"
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span className="field__label">都道府県</span>
            <select
              value={pref}
              onChange={(e) => {
                setPref(e.target.value);
                reset();
              }}
            >
              <option value="">全国</option>
              {prefOptions.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">並び順</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="stores">店舗が多い順</option>
              <option value="prefs">都道府県が多い順</option>
              <option value="name">名前順</option>
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
              reset();
            }}
          >
            すべての部門を見る
          </button>
        )}
      </div>

      <h2 className="section">
        {q ? `「${q}」で探した部門` : "部門"}
        <span className="count">{list.length}種類</span>
      </h2>
      {list.length === 0 ? (
        <p className="empty">条件に一致する部門名はありません。</p>
      ) : (
        <ul className="category-list">
          {list.slice(0, limit).map((r) => (
            <li key={r.name} className="card category">
              <p className="category__name">{r.name}</p>
              <p className="category__meta">
                {r.storeCount > 0 ? `${r.storeCount}店` : "店舗はまだ見つかっていません"}
                {r.prefectureCount > 0 && ` ・ ${r.prefectureCount}都道府県`}
              </p>
              <ul className="category__places">
                {r.divisions.slice(0, preview).map((d) => (
                  <PlaceLink key={d.id} d={d} />
                ))}
              </ul>
              {r.divisions.length > preview && (
                <details className="category__more">
                  <summary>ほか {r.divisions.length - preview}地域を見る</summary>
                  <ul className="category__places">
                    {r.divisions.slice(preview).map((d) => (
                      <PlaceLink key={d.id} d={d} />
                    ))}
                  </ul>
                </details>
              )}
              {r.variants.length > 0 && (
                <p className="category__variant">表記が似ている部門名：{r.variants.join("、")}（同一とは確認していません）</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {list.length > limit && (
        <button type="button" className="button button--block" onClick={() => setLimit(limit + PAGE_SIZE)}>
          さらに表示（残り {list.length - limit}種類）
        </button>
      )}
    </>
  );
}

function PlaceLink({ d }: { d: CategoryRow["divisions"][number] }) {
  return (
    <li>
      <Link href={`/division/${d.id}`} className="place-link">
        <span>{d.label}</span>
        <span className="place-link__count">{d.storeCount > 0 ? `${d.storeCount}店 ›` : "›"}</span>
      </Link>
    </li>
  );
}
