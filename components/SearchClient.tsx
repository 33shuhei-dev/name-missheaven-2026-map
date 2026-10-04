"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Confidence, DataRecord } from "@/data/types";
import { UNKNOWN_PREFECTURE_LABEL, UNKNOWN_PREFECTURE_SLUG } from "@/data/geo";
import { CONFIDENCE_LABEL, CONFIDENCE_ORDER, UNKNOWN_AREA_LABEL } from "@/lib/labels";
import {
  SEARCH_FIELD_LABEL,
  searchPlaces,
  searchRecords,
  type PlaceIndex,
  type SearchFilters,
} from "@/lib/search";
import { RecordCard } from "./RecordCard";

const PAGE_SIZE = 30;

function isConfidence(v: string | null): v is Confidence {
  return v === "confirmed" || v === "probable" || v === "unverified";
}

export function SearchClient({ records, places }: { records: DataRecord[]; places: PlaceIndex }) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(() => sp.get("q") ?? "");
  const [pref, setPref] = useState(() => sp.get("pref") ?? "");
  const [area, setArea] = useState(() => sp.get("area") ?? "");
  const [confidence, setConfidence] = useState<Confidence | "">(() => {
    const c = sp.get("confidence");
    return isConfidence(c) ? c : "";
  });
  const [limit, setLimit] = useState(PAGE_SIZE);

  const syncUrl = (next: { q: string; pref: string; area: string; confidence: string }) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const qs = params.toString();
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    setLimit(PAGE_SIZE);
  };

  const update = (patch: Partial<{ q: string; pref: string; area: string; confidence: Confidence | "" }>) => {
    const next = { q, pref, area, confidence, ...patch };
    if ("pref" in patch && patch.pref !== pref) next.area = "";
    setQ(next.q);
    setPref(next.pref);
    setArea(next.area);
    setConfidence(next.confidence);
    syncUrl(next);
  };

  const prefOptions = useMemo(() => {
    const opts = places.prefectures.map((p) => ({ value: p.slug, label: p.name, count: p.recordCount }));
    const unknownCount = records.filter((r) => !r.prefecture).length;
    if (unknownCount > 0) {
      opts.push({ value: UNKNOWN_PREFECTURE_SLUG, label: UNKNOWN_PREFECTURE_LABEL, count: unknownCount });
    }
    return opts;
  }, [places, records]);

  const areaOptions = useMemo(() => {
    if (!pref) return [];
    const named = places.areas
      .filter((a) => a.prefSlug === pref)
      .map((a) => ({ value: a.id, label: a.name }));
    const hasUnknownArea = records.some(
      (r) =>
        !r.area &&
        (pref === UNKNOWN_PREFECTURE_SLUG
          ? !r.prefecture
          : places.prefectures.find((p) => p.slug === pref)?.name === r.prefecture),
    );
    return hasUnknownArea ? [...named, { value: "none", label: UNKNOWN_AREA_LABEL }] : named;
  }, [pref, places, records]);

  const hits = useMemo(() => {
    const filters: SearchFilters = {
      q,
      pref: pref || undefined,
      area: area || undefined,
      confidence: confidence || undefined,
    };
    return searchRecords(records, filters);
  }, [records, q, pref, area, confidence]);
  const placeHits = useMemo(() => searchPlaces(places, q), [places, q]);
  const hasCondition = !!(q.trim() || pref || area || confidence);

  return (
    <div className="search">
      <form
        className="search-panel"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
      >
        <label className="field">
          <span className="field__label">キーワード</span>
          <input
            type="search"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="部門名・出場者・店舗・地域"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span className="field__label">都道府県</span>
            <select value={pref} onChange={(e) => update({ pref: e.target.value })}>
              <option value="">すべて</option>
              {prefOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}（{o.count}）
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">エリア</span>
            <select
              value={area}
              onChange={(e) => update({ area: e.target.value })}
              disabled={!pref || areaOptions.length === 0}
            >
              <option value="">{pref ? "すべて" : "県を先に選択"}</option>
              {areaOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span className="field__label">確認状態</span>
          <select
            value={confidence}
            onChange={(e) => update({ confidence: isConfidence(e.target.value) ? e.target.value : "" })}
          >
            <option value="">すべて</option>
            {CONFIDENCE_ORDER.map((c) => (
              <option key={c} value={c}>
                {CONFIDENCE_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        {hasCondition && (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => update({ q: "", pref: "", area: "", confidence: "" })}
          >
            条件をクリア
          </button>
        )}
      </form>

      {(placeHits.prefectures.length > 0 || placeHits.areas.length > 0) && (
        <section className="section" aria-labelledby="place-heading">
          <h2 id="place-heading">一致する地域</h2>
          <ul className="chip-list">
            {placeHits.prefectures.map((p) => (
              <li key={p.slug}>
                <Link href={`/pref/${p.slug}`} className="chip">
                  {p.name}
                  <span className="chip__count">{p.recordCount}</span>
                </Link>
              </li>
            ))}
            {placeHits.areas.map((a) => (
              <li key={`${a.prefSlug}-${a.id}`}>
                <Link href={`/pref/${a.prefSlug}/area/${a.id}`} className="chip">
                  {a.name}（{a.prefName}）<span className="chip__count">{a.recordCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section" aria-live="polite">
        <h2>
          {hasCondition ? "検索結果" : "すべての情報"}
          <span className="count">{hits.length}件</span>
        </h2>
        {hits.length === 0 ? (
          <div className="empty">
            <p>条件に一致する情報はありません。</p>
            <p className="hint">表記を短くする、絞り込みを外すなどしてお試しください。</p>
          </div>
        ) : (
          <div className="list">
            {hits.slice(0, limit).map((h) => (
              <div key={h.record.id}>
                {h.matched.length > 0 && (
                  <p className="match-label">
                    一致：{h.matched.map((m) => SEARCH_FIELD_LABEL[m]).join("・")}
                  </p>
                )}
                <RecordCard record={h.record} />
              </div>
            ))}
          </div>
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
