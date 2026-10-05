"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Confidence } from "@/data/types";
import { CONFIDENCE_LABEL, CONFIDENCE_ORDER, confidenceRank } from "@/lib/labels";
import { tokenizeQuery } from "@/lib/text";
import { ConfidenceBadge } from "./Badges";

export interface CategoryRow {
  name: string;
  /** 表記が似ている別の部門名（同一とは確認していない） */
  variants: string[];
  keys: string[];
  recordCount: number;
  /** この部門名に関係する店舗数（店舗×部門関係の店舗IDの重複なし） */
  storeCount: number;
  prefectures: { slug: string; label: string }[];
  confidence: Confidence;
  divisions: { id: string; label: string; confidence: Confidence }[];
}

type Sort = "stores" | "count" | "name" | "prefs";

const PAGE_SIZE = 40;

export function CategoryExplorer({ rows, prefOptions }: { rows: CategoryRow[]; prefOptions: { slug: string; label: string }[] }) {
  const [q, setQ] = useState("");
  const [pref, setPref] = useState("");
  const [confidence, setConfidence] = useState<Confidence | "">("");
  const [sort, setSort] = useState<Sort>("stores");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const list = useMemo(() => {
    const tokens = tokenizeQuery(q);
    const filtered = rows.filter(
      (r) =>
        tokens.every((t) => r.keys.some((k) => k.includes(t))) &&
        (!pref || r.prefectures.some((p) => p.slug === pref)) &&
        (!confidence || r.confidence === confidence),
    );
    const byName = (a: CategoryRow, b: CategoryRow) => a.name.localeCompare(b.name, "ja");
    return filtered.sort((a, b) =>
      sort === "name"
        ? byName(a, b)
        : sort === "prefs"
          ? b.prefectures.length - a.prefectures.length || b.recordCount - a.recordCount || byName(a, b)
          : sort === "stores"
            ? b.storeCount - a.storeCount || b.recordCount - a.recordCount || byName(a, b)
            : b.recordCount - a.recordCount || confidenceRank(a.confidence) - confidenceRank(b.confidence) || byName(a, b),
    );
  }, [rows, q, pref, confidence, sort]);

  const reset = () => setLimit(PAGE_SIZE);

  return (
    <>
      <div className="search-panel">
        <label className="field">
          <span className="field__label">部門名で絞り込み</span>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              reset();
            }}
            placeholder="例：コスプレ、美尻"
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
              <option value="">すべて</option>
              {prefOptions.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">確認状態</span>
            <select
              value={confidence}
              onChange={(e) => {
                const v = e.target.value;
                setConfidence(v === "confirmed" || v === "probable" || v === "unverified" ? v : "");
                reset();
              }}
            >
              <option value="">すべて</option>
              {CONFIDENCE_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CONFIDENCE_LABEL[c]}あり
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span className="field__label">並び順</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="stores">店舗数が多い順</option>
            <option value="count">観測件数が多い順</option>
            <option value="prefs">都道府県数が多い順</option>
            <option value="name">名前順</option>
          </select>
        </label>
      </div>

      <h2 className="section">
        部門名<span className="count">{list.length}種類</span>
      </h2>
      {list.length === 0 ? (
        <p className="empty">条件に一致する部門名はありません。</p>
      ) : (
        <ul className="category-list">
          {list.slice(0, limit).map((r) => (
            <li key={r.name} className="card category">
              <div className="category__head">
                <p className="category__name">{r.name}</p>
                <ConfidenceBadge value={r.confidence} small />
              </div>
              <p className="category__meta">
                店舗 {r.storeCount} ・ 観測 {r.recordCount}件 ・ {r.prefectures.map((p) => p.label).join("、")}
              </p>
              <ul className="category__places">
                {r.divisions.map((d) => (
                  <li key={d.id}>
                    <Link href={`/division/${d.id}`} className="place-link">
                      <span>{d.label}</span>
                      <ConfidenceBadge value={d.confidence} small />
                    </Link>
                  </li>
                ))}
              </ul>
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
