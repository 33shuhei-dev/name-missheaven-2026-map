"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Confidence } from "@/data/types";
import { CONFIDENCE_LABEL, CONFIDENCE_ORDER, MAP_STATUS_LABEL, STORE_CONFIDENCE_LABEL, UNKNOWN_AREA_LABEL } from "@/lib/labels";
import {
  SEARCH_KIND_LABEL,
  SEARCH_KIND_ORDER,
  searchItems,
  type SearchItem,
  type SearchKind,
} from "@/lib/search";
import { ConfidenceBadge } from "./Badges";

export interface PlaceOption {
  slug: string;
  name: string;
  recordCount: number;
  areas: { id: string; label: string; name?: string }[];
}

const PAGE_SIZE = 40;

const isConfidence = (v: string | null): v is Confidence =>
  v === "confirmed" || v === "probable" || v === "unverified";
const isKind = (v: string | null): v is SearchKind => !!v && (SEARCH_KIND_ORDER as string[]).includes(v);

type State = { q: string; kind: SearchKind | ""; pref: string; area: string; confidence: Confidence | "" };

export function SearchClient({ items, places }: { items: SearchItem[]; places: PlaceOption[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [state, setState] = useState<State>(() => ({
    q: sp.get("q") ?? "",
    kind: isKind(sp.get("kind")) ? (sp.get("kind") as SearchKind) : "",
    pref: sp.get("pref") ?? "",
    area: sp.get("area") ?? "",
    confidence: isConfidence(sp.get("confidence")) ? (sp.get("confidence") as Confidence) : "",
  }));
  const [limit, setLimit] = useState(PAGE_SIZE);

  const update = (patch: Partial<State>) => {
    const next = { ...state, ...patch };
    if ("pref" in patch && patch.pref !== state.pref) next.area = "";
    setState(next);
    setLimit(PAGE_SIZE);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const qs = params.toString();
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
  };

  const prefOption = places.find((p) => p.slug === state.pref);

  const hits = useMemo(
    () =>
      searchItems(
        items,
        {
          q: state.q,
          kind: state.kind || undefined,
          pref: state.pref || undefined,
          area: state.area || undefined,
          confidence: state.confidence || undefined,
        },
      ),
    [items, state],
  );
  const kindCounts = useMemo(() => {
    const all = searchItems(
      items,
      { q: state.q, pref: state.pref || undefined, area: state.area || undefined, confidence: state.confidence || undefined },
    );
    const c: Record<string, number> = {};
    for (const h of all) c[h.item.kind] = (c[h.item.kind] ?? 0) + 1;
    return { total: all.length, c };
  }, [items, state.q, state.pref, state.area, state.confidence]);

  const hasCondition = !!(state.q.trim() || state.kind || state.pref || state.area || state.confidence);

  return (
    <div className="search">
      <form className="search-panel" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="field">
          <span className="field__label">キーワード</span>
          <input
            type="search"
            value={state.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="部門・店舗・出場者・地域"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span className="field__label">都道府県</span>
            <select value={state.pref} onChange={(e) => update({ pref: e.target.value })}>
              <option value="">すべて</option>
              {places.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}（{p.recordCount}）
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">掲載地域</span>
            <select
              value={state.area}
              onChange={(e) => update({ area: e.target.value })}
              disabled={!prefOption || prefOption.areas.length === 0}
            >
              <option value="">{state.pref ? "すべて" : "県を先に選択"}</option>
              {prefOption?.areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span className="field__label">確認状態</span>
          <select
            value={state.confidence}
            onChange={(e) => update({ confidence: isConfidence(e.target.value) ? e.target.value : "" })}
          >
            <option value="">すべて</option>
            {CONFIDENCE_ORDER.map((c) => (
              <option key={c} value={c}>
                {(state.kind === "store" ? STORE_CONFIDENCE_LABEL : CONFIDENCE_LABEL)[c]}
              </option>
            ))}
          </select>
        </label>
        {hasCondition && (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => update({ q: "", kind: "", pref: "", area: "", confidence: "" })}
          >
            条件をクリア
          </button>
        )}
      </form>

      <div className="kind-tabs" role="group" aria-label="種別で絞り込み">
        <button type="button" className={`chip${state.kind === "" ? " is-active" : ""}`} aria-pressed={state.kind === ""} onClick={() => update({ kind: "" })}>
          すべて<span className="chip__count">{kindCounts.total}</span>
        </button>
        {SEARCH_KIND_ORDER.map((k) => (
          <button
            key={k}
            type="button"
            className={`chip${state.kind === k ? " is-active" : ""}`}
            aria-pressed={state.kind === k}
            onClick={() => update({ kind: k })}
          >
            {SEARCH_KIND_LABEL[k]}
            <span className="chip__count">{kindCounts.c[k] ?? 0}</span>
          </button>
        ))}
      </div>

      <section className="section" aria-live="polite">
        <h2>
          {hasCondition ? "検索結果" : "すべての項目"}
          <span className="count">{hits.length}件</span>
        </h2>
        {hits.length === 0 ? (
          <div className="empty">
            <p>条件に一致する項目はありません。</p>
            <p className="hint">語を短くする、絞り込みを外すなどしてお試しください。掲載していない情報は「存在しない」という意味ではありません。</p>
          </div>
        ) : (
          <ul className="result-list">
            {hits.slice(0, limit).map(({ item }) => (
              <li key={`${item.kind}-${item.id}`}>
                <Link href={item.href} className="result">
                  <span className={`result__kind result__kind--${item.kind}`}>{SEARCH_KIND_LABEL[item.kind]}</span>
                  <span className="result__main">
                    <span className="result__name">{item.name}</span>
                    <span className="result__place">
                      {item.kind === "prefecture"
                        ? item.sub
                        : `${item.prefName} / ${item.kind === "area" ? item.name : (item.listingArea ?? UNKNOWN_AREA_LABEL)}`}
                    </span>
                    {item.kind !== "prefecture" && item.sub && <span className="result__sub">{item.sub}</span>}
                  </span>
                  <span className="result__badge">
                    {item.status ? (
                      <span className={`status status--${item.status} status--small`}>
                        <span className={`legend__swatch legend__swatch--${item.status}`} aria-hidden="true" />
                        {MAP_STATUS_LABEL[item.status]}
                      </span>
                    ) : item.confidence ? (
                      <ConfidenceBadge value={item.confidence} small subject={item.kind === "store" ? "store" : undefined} />
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {hits.length > limit && (
          <button type="button" className="button button--block" onClick={() => setLimit(limit + PAGE_SIZE)}>
            さらに表示（残り {hits.length - limit}件）
          </button>
        )}
      </section>
    </div>
  );
}
