/**
 * 47都道府県の SVG パスを生成するスクリプト（開発時に1回だけ実行。実行時の依存ではない）。
 *
 * 元データ: jpn-atlas@1.0.2 の japan/japan.json（BSD-3-Clause。
 *           出典: 国土地理院「地球地図日本」2016）
 *
 *   npm pack jpn-atlas@1.0.2 && tar xzf jpn-atlas-1.0.2.tgz
 *   node scripts/generate-japan-map.mjs package/japan/japan.json > data/japan-map.generated.ts
 *
 * 処理:
 * - TopoJSON の arc を共有したまま Douglas–Peucker で簡略化（県境に隙間ができない）
 * - 東京都の伊豆・小笠原諸島など本土から離れた小さな島を省略
 * - 沖縄県を拡大して左上の枠内へ移動し、先島諸島との間の海を詰める（日本地図で一般的な配置。縮尺・位置は実際と異なる）
 */
import { readFileSync } from "node:fs";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/generate-japan-map.mjs <path/to/japan.json>");
  process.exit(1);
}
const topo = JSON.parse(readFileSync(src, "utf8"));
const [sx, sy] = topo.transform.scale;
const [tx, ty] = topo.transform.translate;

const TOLERANCE = 0.55;
const MIN_ISLAND_AREA = 6; // これより小さい島（px²）は省略。各県の最大ポリゴンは必ず残す

function dp(points, tol) {
  if (points.length <= 2) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  let maxD = -1;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const d = len === 0 ? Math.hypot(px - ax, py - ay) : Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= tol) return [points[0], points[points.length - 1]];
  return [...dp(points.slice(0, idx + 1), tol).slice(0, -1), ...dp(points.slice(idx), tol)];
}

const arcs = topo.arcs.map((a) => {
  let x = 0;
  let y = 0;
  const pts = a.map(([qx, qy]) => {
    x += qx;
    y += qy;
    return [x * sx + tx, y * sy + ty];
  });
  // 閉じた arc（島）は2点に潰れないよう、中間点で分けて簡略化する
  if (pts.length > 3 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1]) {
    const mid = Math.floor(pts.length / 2);
    return [...dp(pts.slice(0, mid + 1), TOLERANCE).slice(0, -1), ...dp(pts.slice(mid), TOLERANCE)];
  }
  return dp(pts, TOLERANCE);
});

function ringPoints(ring) {
  const out = [];
  for (const i of ring) {
    const a = i < 0 ? [...arcs[~i]].reverse() : arcs[i];
    out.push(...(out.length ? a.slice(1) : a));
  }
  return out;
}

function area(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

function centroid(ring) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  return [cx / (3 * a), cy / (3 * a)];
}

// 東京都の離島（伊豆諸島・小笠原）は本土から遠く、地図を大きく広げるため省略
const TOKYO_MAX_Y = 330;
// 鹿児島県の与論島・沖永良部島付近より南の小島は、地図の高さを大きく広げるため省略
const KAGOSHIMA_MAX_Y = 500;
// 沖縄県は拡大して左上の枠へ移動する（元の位置の左上を基準に拡大し、平行移動）
// 先島諸島（宮古・八重山）は本島との間の海を詰めて表示する（挿入枠の慣例的な表現）
const SAKISHIMA_MAX_X = 150;
const SAKISHIMA_SHIFT_X = 80;
const OKINAWA_SCALE = 1.45;
const OKINAWA_ORIGIN = [172, 14];

const prefs = topo.objects.prefectures.geometries.map((g) => {
  const polys = (g.type === "Polygon" ? [g.arcs] : g.arcs).map((p) => p.map(ringPoints));
  let kept = polys.filter((p) => p[0].length >= 4);
  const largest = kept.reduce((m, p) => (Math.abs(area(p[0])) > Math.abs(area(m[0])) ? p : m), kept[0]);
  kept = kept.filter((p) => p === largest || Math.abs(area(p[0])) >= MIN_ISLAND_AREA);
  if (g.id === "13") kept = kept.filter((p) => p === largest || Math.max(...p[0].map(([, y]) => y)) < TOKYO_MAX_Y);
  if (g.id === "46") kept = kept.filter((p) => p === largest || Math.min(...p[0].map(([, y]) => y)) < KAGOSHIMA_MAX_Y);
  if (g.id === "47") {
    kept = kept.map((p) =>
      Math.max(...p[0].map(([x]) => x)) < SAKISHIMA_MAX_X
        ? p.map((r) => r.map(([x, y]) => [x + SAKISHIMA_SHIFT_X, y]))
        : p,
    );
    const x0 = Math.min(...kept.flatMap((p) => p[0].map(([x]) => x)));
    const y0 = Math.min(...kept.flatMap((p) => p[0].map(([, y]) => y)));
    kept = kept.map((p) =>
      p.map((r) =>
        r.map(([x, y]) => [OKINAWA_ORIGIN[0] + (x - x0) * OKINAWA_SCALE, OKINAWA_ORIGIN[1] + (y - y0) * OKINAWA_SCALE]),
      ),
    );
  }
  return { code: g.id, polys: kept, largest: g.id === "47" ? kept.reduce((m, p) => (Math.abs(area(p[0])) > Math.abs(area(m[0])) ? p : m), kept[0]) : largest };
});

const r1 = (v) => Math.round(v * 10) / 10;
const all = prefs.flatMap((p) => p.polys.flat(2));
const minX = Math.min(...all.map((q) => q[0])) - 8;
const minY = Math.min(...all.map((q) => q[1])) - 8;
const maxX = Math.max(...all.map((q) => q[0])) + 4;
const maxY = Math.max(...all.map((q) => q[1])) + 4;

const out = prefs.map((p) => {
  const pts = p.polys.flat(2);
  const d = p.polys
    .map((poly) =>
      poly
        .map((ring) => {
          const rel = ring.map(([x, y]) => [r1(x - minX), r1(y - minY)]);
          return "M" + rel.map(([x, y]) => `${x} ${y}`).join("L") + "Z";
        })
        .join(""),
    )
    .join("");
  const [cx, cy] = centroid(p.largest[0]);
  return {
    code: p.code,
    d,
    bbox: [
      r1(Math.min(...pts.map((q) => q[0])) - minX),
      r1(Math.min(...pts.map((q) => q[1])) - minY),
      r1(Math.max(...pts.map((q) => q[0])) - minX),
      r1(Math.max(...pts.map((q) => q[1])) - minY),
    ],
    label: [r1(cx - minX), r1(cy - minY)],
  };
});

const ok = out.find((p) => p.code === "47");
const inset = [r1(ok.bbox[0] - 6), r1(ok.bbox[1] - 6), r1(ok.bbox[2] - ok.bbox[0] + 12), r1(ok.bbox[3] - ok.bbox[1] + 12)];

console.log(`// このファイルは scripts/generate-japan-map.mjs で生成。手で編集しない。
// 元データ: jpn-atlas@1.0.2（BSD-3-Clause）/ 出典: 国土地理院「地球地図日本」2016 を加工
// 東京都の伊豆・小笠原諸島などの小さな離島は省略。沖縄県は左上の枠内に移動して表示。

export interface MapPrefectureShape {
  /** JIS都道府県コード（2桁文字列） */
  code: string;
  /** SVG path */
  d: string;
  /** [minX, minY, maxX, maxY] */
  bbox: [number, number, number, number];
  /** ラベル位置（最大の島の重心） */
  label: [number, number];
}

export const JAPAN_MAP_WIDTH = ${r1(maxX - minX)};
export const JAPAN_MAP_HEIGHT = ${r1(maxY - minY)};
/** 沖縄県の挿入枠 [x, y, width, height] */
export const OKINAWA_INSET: [number, number, number, number] = ${JSON.stringify(inset)};

export const JAPAN_MAP_SHAPES: MapPrefectureShape[] = ${JSON.stringify(out)};`);
