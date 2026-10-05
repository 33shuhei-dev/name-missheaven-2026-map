"use client";

import { useState } from "react";
import type { MapStatus } from "@/data/types";
import {
  JAPAN_MAP_HEIGHT,
  JAPAN_MAP_SHAPES,
  JAPAN_MAP_WIDTH,
  OKINAWA_INSET,
} from "@/data/japan-map.generated";
import { MAP_STATUS_LABEL } from "@/lib/labels";

export interface MapPrefecture {
  code: string;
  slug: string;
  name: string;
  regionId: string;
  status: MapStatus;
  recordCount: number;
  storeCount: number;
}

/** 地図の拡大範囲（小さな都府県をスマホでタップしやすくするため） */
const ZOOMS: { id: string; label: string; regions: string[] }[] = [
  { id: "all", label: "全国", regions: [] },
  { id: "tohoku", label: "東北", regions: ["tohoku"] },
  { id: "kanto", label: "関東", regions: ["kanto"] },
  { id: "chubu", label: "中部", regions: ["chubu"] },
  { id: "kinki", label: "近畿", regions: ["kinki"] },
  { id: "west", label: "中国・四国", regions: ["chugoku", "shikoku"] },
  { id: "kyushu", label: "九州・沖縄", regions: ["kyushu"] },
];

const shapeByCode = new Map(JAPAN_MAP_SHAPES.map((s) => [s.code, s]));
const RATIO = JAPAN_MAP_WIDTH / JAPAN_MAP_HEIGHT;

function shortName(name: string): string {
  return name === "北海道" ? name : name.replace(/[都府県]$/, "");
}

/** 拡大範囲の viewBox（縦横比は全国表示と同じにして、表示の高さが変わらないようにする） */
function viewBoxFor(prefs: MapPrefecture[], regions: string[]): [number, number, number, number] {
  if (regions.length === 0) return [0, 0, JAPAN_MAP_WIDTH, JAPAN_MAP_HEIGHT];
  // 沖縄は左上の挿入枠に描いているため、九州の拡大範囲には含めない
  const boxes = prefs
    .filter((p) => regions.includes(p.regionId) && p.code !== "47")
    .map((p) => shapeByCode.get(p.code)!.bbox);
  let [x0, y0, x1, y1] = [
    Math.min(...boxes.map((b) => b[0])),
    Math.min(...boxes.map((b) => b[1])),
    Math.max(...boxes.map((b) => b[2])),
    Math.max(...boxes.map((b) => b[3])),
  ];
  const pad = Math.max(x1 - x0, y1 - y0) * 0.08;
  x0 -= pad;
  y0 -= pad;
  x1 += pad;
  y1 += pad;
  let w = x1 - x0;
  let h = y1 - y0;
  if (w / h < RATIO) {
    const nw = h * RATIO;
    x0 -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = w / RATIO;
    y0 -= (nh - h) / 2;
    h = nh;
  }
  return [x0, y0, w, h];
}

/**
 * 47都道府県の地図。色は「調査状態」（人気・順位・出場者数ではない）。
 * 各県は都道府県ページへのリンク。JavaScript が無効でもリンクとして動作する。
 */
export function JapanMap({ prefectures }: { prefectures: MapPrefecture[] }) {
  const [zoom, setZoom] = useState("all");
  const current = ZOOMS.find((z) => z.id === zoom)!;
  const [vx, vy, vw, vh] = viewBoxFor(prefectures, current.regions);
  const zoomed = current.regions.length > 0;
  const fontSize = vw / 24;
  // 斜線パターンは拡大しても同じ見た目の太さにする
  const hatch = 5 * (vw / JAPAN_MAP_WIDTH);
  const okinawa = prefectures.find((p) => p.code === "47");

  return (
    <div className="jmap">
      <svg
        className="jmap__svg"
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        role="group"
        aria-label="47都道府県の調査状態の地図。都道府県を選ぶとその都道府県のページを開きます。"
      >
        <defs>
          <pattern id="jmap-hatch" width={hatch} height={hatch} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={hatch} height={hatch} fill="var(--map-candidate-bg)" />
            <line x1="0" y1="0" x2="0" y2={hatch} stroke="var(--map-candidate-line)" strokeWidth={hatch * 0.44} />
          </pattern>
        </defs>

        {/* 沖縄県の挿入枠（枠全体をタップ可能にする） */}
        {okinawa && (!zoomed || current.id === "kyushu") && (
          <a href={`/pref/${okinawa.slug}`} aria-label={`${okinawa.name}：${MAP_STATUS_LABEL[okinawa.status]}（店舗${okinawa.storeCount}・観測${okinawa.recordCount}件）`}>
            <rect
              className="jmap__inset"
              x={OKINAWA_INSET[0]}
              y={OKINAWA_INSET[1]}
              width={OKINAWA_INSET[2]}
              height={OKINAWA_INSET[3]}
              rx="4"
            />
          </a>
        )}

        {prefectures.map((p) => {
          const shape = shapeByCode.get(p.code);
          if (!shape) return null;
          return (
            <a
              key={p.code}
              href={`/pref/${p.slug}`}
              className={`jmap__pref jmap__pref--${p.status}`}
              aria-label={`${p.name}：${MAP_STATUS_LABEL[p.status]}（店舗${p.storeCount}・観測${p.recordCount}件）`}
            >
              <title>{`${p.name}：${MAP_STATUS_LABEL[p.status]}（店舗${p.storeCount}・観測${p.recordCount}件）`}</title>
              <path d={shape.d} vectorEffect="non-scaling-stroke" />
            </a>
          );
        })}

        {okinawa && !zoomed && (
          <text
            className="jmap__inset-label"
            x={OKINAWA_INSET[0] + 4}
            y={OKINAWA_INSET[1] + OKINAWA_INSET[3] - 6}
            fontSize={14}
          >
            沖縄県
          </text>
        )}

        {zoomed &&
          prefectures
            .filter((p) => current.regions.includes(p.regionId) && p.code !== "47")
            .map((p) => {
              const shape = shapeByCode.get(p.code)!;
              return (
                <text
                  key={`l-${p.code}`}
                  className={`jmap__label jmap__label--${p.status}`}
                  x={shape.label[0]}
                  y={shape.label[1]}
                  fontSize={fontSize}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {shortName(p.name)}
                </text>
              );
            })}
      </svg>
      <div className="jmap__zoom" role="group" aria-label="地図の表示範囲（地方を拡大）">
        {ZOOMS.map((z) => (
          <button
            key={z.id}
            type="button"
            className={`jmap__zoom-btn${z.id === zoom ? " is-active" : ""}`}
            aria-pressed={z.id === zoom}
            onClick={() => setZoom(z.id)}
          >
            {z.label}
          </button>
        ))}
      </div>

      <p className="jmap__hint">
        {zoomed ? "都道府県をタップすると詳しいページを開きます。" : "地方を選ぶと拡大して、小さな都府県もタップしやすくなります。"}
      </p>
    </div>
  );
}
