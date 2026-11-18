"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * 無限投票：投票をしているように見えるだけの、意味のないタップゲーム。
 * 本物の投票ではない。送信も、順位表も、実在の出場者の名前もない。保存は、遊んでいる端末の中だけ。
 */

const SAVE_KEY = "mugen-touhyou-v1";
const MAX_OFFLINE_SEC = 8 * 3600;

type Save = {
  votes: number; // 使える票
  totalVoters: number;
  totalVotes: number;
  taps: number;
  owned: Record<string, number>;
  seen: string[]; // 達成済みの実績
  savedAt: number;
};

type Upgrade = {
  id: string;
  name: string;
  desc: string;
  base: number;
  growth: number;
  max?: number;
};

const UPGRADES: readonly Upgrade[] = [
  { id: "oen", name: "応援団", desc: "1秒に、1人ずつ投票してくれる", base: 15, growth: 1.16 },
  { id: "yobi", name: "呼びかけ", desc: "1タップで投票する人が、+1人", base: 80, growth: 1.6 },
  { id: "rate", name: "倍率アップ", desc: "1人あたりの票が増える（最大3倍まで）", base: 10000, growth: 15, max: 2 },
  { id: "thanks", name: "お礼メッセージ", desc: "応援団の働きが、1.25倍", base: 1000, growth: 2.2 },
  { id: "tour", name: "全国ツアー", desc: "1秒に、20人ずつ投票してくれる", base: 20000, growth: 1.25 },
  { id: "chair", name: "椅子の増設", desc: "椅子が1脚ふえる。意味はありません", base: 15000, growth: 3, max: 5 },
] as const;

type Ach = { id: string; label: string; note: string; test: (s: Save) => boolean };

const ICONS: Record<string, string> = { oen: "up-oen", yobi: "up-yobi", rate: "up-rate", thanks: "up-thanks", tour: "up-tour", chair: "up-chair" };
const MEDALS: Record<string, string> = { a3: "medal-pref", a4: "medal-block", a5: "medal-japan" };

const ACHS: readonly Ach[] = [
  { id: "a1", label: "はじめの1人", note: "", test: (s) => s.totalVoters >= 1 },
  { id: "a2", label: "10人", note: "", test: (s) => s.totalVoters >= 10 },
  { id: "a3", label: "50人：都道府県代表", note: "称号の条件にあたる数字", test: (s) => s.totalVoters >= 50 },
  { id: "a4", label: "100人：ブロック代表", note: "称号の条件にあたる数字", test: (s) => s.totalVoters >= 100 },
  { id: "a5", label: "200人：日本代表", note: "称号の条件にあたる数字", test: (s) => s.totalVoters >= 200 },
  { id: "a6", label: "500人", note: "", test: (s) => s.totalVoters >= 500 },
  { id: "a7", label: "1,000人", note: "", test: (s) => s.totalVoters >= 1000 },
  { id: "a8", label: "3,000人", note: "", test: (s) => s.totalVoters >= 3000 },
  { id: "a9", label: "7,634人：本選に進んだ人数ぶん", note: "特集3の数字", test: (s) => s.totalVoters >= 7634 },
  { id: "a10", label: "1万票", note: "", test: (s) => s.totalVotes >= 10000 },
  { id: "a11", label: "15万票：去年の1位の目安", note: "特集1の数字", test: (s) => s.totalVotes >= 150000 },
  { id: "a12", label: "3億票", note: "", test: (s) => s.totalVotes >= 300000000 },
  { id: "a13", label: "倍率3倍に到達", note: "", test: (s) => (s.owned.rate ?? 0) >= 2 },
  { id: "a14", label: "応援団が30組", note: "", test: (s) => (s.owned.oen ?? 0) >= 30 },
  { id: "a15", label: "全部そろった（意味はありません）", note: "", test: (s) => s.seen.length >= 14 },
] as const;

function fresh(): Save {
  return { votes: 0, totalVoters: 0, totalVotes: 0, taps: 0, owned: {}, seen: [], savedAt: Date.now() };
}

function costOf(u: Upgrade, owned: number): number {
  return Math.floor(u.base * Math.pow(u.growth, owned));
}

/** 大きな数は、万・億で読みやすくする */
function fmt(n: number): string {
  const v = Math.floor(n);
  if (v < 10000) return v.toLocaleString("ja-JP");
  if (v < 100000000) return `${(v / 10000).toFixed(v < 1000000 ? 2 : 1).replace(/\.?0+$/, "")}万`;
  return `${(v / 100000000).toFixed(2).replace(/\.?0+$/, "")}億`;
}

function derive(s: Save) {
  const o = s.owned;
  const perTap = 1 + (o.yobi ?? 0);
  const mult = 1 + (o.rate ?? 0);
  const thanks = Math.pow(1.25, o.thanks ?? 0);
  const autoVoters = ((o.oen ?? 0) * 1 + (o.tour ?? 0) * 20) * thanks;
  return { perTap, mult, autoVoters, autoVotes: autoVoters * mult, extraChairs: o.chair ?? 0 };
}

function load(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return fresh();
    const p = JSON.parse(raw) as Partial<Save>;
    const base = fresh();
    return {
      ...base,
      ...p,
      owned: typeof p.owned === "object" && p.owned ? p.owned : {},
      seen: Array.isArray(p.seen) ? p.seen : [],
    };
  } catch {
    return fresh();
  }
}

type Pop = { id: number; x: number; y: number; text: string };

export function MugenVote() {
  const [s, setS] = useState<Save>(() => fresh());
  const [ready, setReady] = useState(false);
  const [tickets, setTickets] = useState(50);
  const [refill, setRefill] = useState(false);
  const [pops, setPops] = useState<Pop[]>([]);
  const [toast, setToast] = useState("");
  const [mood, setMood] = useState<"idle" | "happy" | "sleep">("idle");
  const lastTap = useRef(0);
  const popId = useRef(0);
  const sRef = useRef(s);
  useEffect(() => {
    sRef.current = s;
  }, [s]);
  const frac = useRef(0);

  const d = useMemo(() => derive(s), [s]);

  // 読み込み（放置ぶんの加算つき）。端末の保存データを読むので、描画のあとに行う
  useEffect(() => {
    const id = setTimeout(() => {
      const loaded = load();
      const dv = derive(loaded);
      const elapsed = Math.min(Math.max(0, (Date.now() - loaded.savedAt) / 1000), MAX_OFFLINE_SEC);
      const gainV = Math.floor(dv.autoVoters * elapsed);
      if (gainV > 0) {
        loaded.votes += gainV * dv.mult;
        loaded.totalVoters += gainV;
        loaded.totalVotes += gainV * dv.mult;
        setToast(`おかえりなさい。留守のあいだに、${fmt(gainV)}人が投票してくれました。`);
      }
      sRef.current = loaded;
      setS(loaded);
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // 実績の判定
  const checkAch = useCallback((next: Save): Save => {
    let changed = false;
    const seen = [...next.seen];
    for (const a of ACHS) {
      if (!seen.includes(a.id) && a.test({ ...next, seen })) {
        seen.push(a.id);
        changed = true;
      }
    }
    return changed ? { ...next, seen } : next;
  }, []);

  // 自動投票（0.1秒ごと）と保存
  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => {
      const cur = sRef.current;
      const dv = derive(cur);
      let next = cur;
      if (dv.autoVoters > 0) {
        frac.current += dv.autoVoters * 0.1;
        const whole = Math.floor(frac.current);
        if (whole > 0) {
          frac.current -= whole;
          next = {
            ...next,
            votes: next.votes + whole * dv.mult,
            totalVoters: next.totalVoters + whole,
            totalVotes: next.totalVotes + whole * dv.mult,
          };
        }
      }
      next = checkAch(next);
      if (next !== cur) {
        sRef.current = next;
        setS(next);
      }
    }, 100);
    return () => clearInterval(t);
  }, [ready, checkAch]);

  useEffect(() => {
    if (!ready) return;
    const save = () => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ ...sRef.current, savedAt: Date.now() }));
      } catch {
        /* 保存できなくても、遊べる */
      }
    };
    const t = setInterval(save, 3000);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(t);
      window.removeEventListener("pagehide", save);
    };
  }, [ready]);

  // マスコットの様子：タップ中は大喜び、しばらく放っておくとねむる
  useEffect(() => {
    if (!ready) return;
    lastTap.current = Date.now();
    const t = setInterval(() => {
      const dt = Date.now() - lastTap.current;
      setMood(dt < 1200 ? "happy" : dt > 12000 ? "sleep" : "idle");
    }, 400);
    return () => clearInterval(t);
  }, [ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const tap = (e: React.PointerEvent | React.KeyboardEvent) => {
    const cur = sRef.current;
    const dv = derive(cur);
    const gain = dv.perTap;
    const next = checkAch({
      ...cur,
      votes: cur.votes + gain * dv.mult,
      totalVoters: cur.totalVoters + gain,
      totalVotes: cur.totalVotes + gain * dv.mult,
      taps: cur.taps + 1,
    });
    sRef.current = next;
    setS(next);
    lastTap.current = Date.now();
    setMood("happy");
    // 持ち票のメーター（本物の制度のまね。この遊びでは、無限に補充される）
    setTickets((t) => {
      if (t <= 1) {
        setRefill(true);
        setTimeout(() => setRefill(false), 1400);
        return 50;
      }
      return t - 1;
    });
    // ぽんと出る数字
    let x = 50;
    let y = 40;
    if ("clientX" in e) {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * 100;
      y = ((e.clientY - r.top) / r.height) * 100;
    }
    const id = ++popId.current;
    setPops((p) => [...p.slice(-14), { id, x, y, text: `+${fmt(gain * dv.mult)}票` }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 800);
  };

  const buy = (u: Upgrade) => {
    const cur = sRef.current;
    const n = cur.owned[u.id] ?? 0;
    if (u.max !== undefined && n >= u.max) return;
    const c = costOf(u, n);
    if (cur.votes < c) return;
    const bought = checkAch({ ...cur, votes: cur.votes - c, owned: { ...cur.owned, [u.id]: n + 1 } });
    sRef.current = bought;
    setS(bought);
  };

  const reset = () => {
    if (!window.confirm("最初からやり直します。よろしいですか？")) return;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* 何もしない */
    }
    frac.current = 0;
    const f = fresh();
    sRef.current = f;
    setS(f);
    setTickets(50);
  };

  const chairs = 15 + d.extraChairs;
  const lit = s.seen.length;
  const crowned = s.seen.includes("a5");
  const mascot = mood === "sleep" ? "mascot-sleep" : mood === "happy" ? "mascot-happy" : crowned ? "mascot-crown" : "mascot-idle";
  const latest = ACHS.filter((a) => s.seen.includes(a.id)).slice(-1)[0];

  return (
    <div className="mv">
      <p className="mv__notice" role="note">
        これは遊びです。<strong>本物の投票ではありません。</strong>何も送信されません。
      </p>

      <div className="mv__hero">
      <div className="mv__counts">
        <div>
          <small>投票した人</small>
          <b>{fmt(s.totalVoters)}<span>人</span></b>
        </div>
        <div>
          <small>使える票</small>
          <b>{fmt(s.votes)}<span>票</span></b>
        </div>
      </div>
      <p className="mv__rate">
        1秒に {fmt(d.autoVoters)}人 ／ 1人あたり {d.mult}倍 ／ 1タップ {d.perTap}人
      </p>

      <div className="mv__mascot" aria-hidden="true">
        <Image src={`/game/${mascot}.webp`} alt="" width={480} height={480} unoptimized draggable={false} />
      </div>

      <div className="mv__stage">
        <button
          type="button"
          className="mv__btn"
          aria-label="投票する（ゲームです）"
          onPointerDown={(e) => {
            e.preventDefault();
            tap(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              tap(e);
            }
          }}
        >
          <Image className="mv__btn-img" src="/game/btn.webp" alt="" fill sizes="280px" unoptimized draggable={false} priority />
          <span className="mv__btn-main">投票</span>
          <span className="mv__btn-sub">タップ</span>
          {pops.map((p) => (
            <i key={p.id} className="mv__pop" style={{ left: `${p.x}%`, top: `${p.y}%` }} aria-hidden="true">
              <Image className="mv__pop-spark" src="/game/spark.webp" alt="" width={22} height={22} unoptimized />
              {p.text}
            </i>
          ))}
        </button>
      </div>
      </div>

      <div className="mv__meter" aria-hidden="true">
        <div className="mv__meter-bar">
          <i style={{ width: `${(tickets / 50) * 100}%` }} />
        </div>
        <span>持ち票 {tickets} / 50</span>
      </div>
      <p className="mv__meter-note">
        {refill ? "持ち票がなくなりました…と思いきや、無限に補充されます。" : "本物の持ち票は最大50枚。ここでは、いくらでも補充されます。"}
      </p>

      <section className="mv__chairs" aria-label="椅子">
        <h2>椅子（{lit} / 15 脚が埋まりました）</h2>
        <div className="mv__chair-row" aria-hidden="true">
          {Array.from({ length: chairs }, (_, i) => (
            <Image key={i} src={`/game/${i < lit ? "chair-on" : i >= 15 ? "chair-extra" : "chair-off"}.webp`} alt="" width={26} height={26} unoptimized />
          ))}
        </div>
        {latest ? (
          <p className="mv__latest">
            いちばん新しい実績：<b>{latest.label}</b>
            {latest.note ? <small>（{latest.note}）</small> : null}
          </p>
        ) : (
          <p className="mv__latest">タップして、最初の1人を迎えましょう。</p>
        )}
      </section>

      <section className="mv__ups" aria-label="アップグレード">
        <h2>アップグレード</h2>
        <ul>
          {UPGRADES.map((u) => {
            const n = s.owned[u.id] ?? 0;
            const maxed = u.max !== undefined && n >= u.max;
            const c = costOf(u, n);
            const can = !maxed && s.votes >= c;
            return (
              <li key={u.id}>
                <Image className="mv__up-ic" src={`/game/${ICONS[u.id]}.webp`} alt="" width={52} height={52} unoptimized />
                <div className="mv__up-info">
                  <b>{u.name}</b>
                  <span className="mv__up-n">{n}</span>
                  <small>{u.desc}</small>
                </div>
                <button type="button" className="mv__buy" disabled={!can} onClick={() => buy(u)}>
                  {maxed ? "これ以上は無し" : `${fmt(c)}票`}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mv__ach" aria-label="実績">
        <h2>実績（{lit} / 15）</h2>
        <ul>
          {ACHS.map((a) => (
            <li key={a.id} className={s.seen.includes(a.id) ? "is-on" : ""}>
              {MEDALS[a.id] ? (
                <Image className={s.seen.includes(a.id) ? "mv__medal" : "mv__medal is-off"} src={`/game/${MEDALS[a.id]}.webp`} alt="" width={28} height={28} unoptimized />
              ) : null}
              {s.seen.includes(a.id) ? (MEDALS[a.id] ? "" : "✔ ") + a.label : "？？？"}
            </li>
          ))}
        </ul>
      </section>

      {toast ? <p className="mv__toast" role="status">{toast}</p> : null}

      <p className="mv__fine">
        非公式・有志のお遊びです。公式とは関係ありません。実在の出場者の名前や、実際の票数は使っていません。保存は、この端末の中だけです。
      </p>
      <p className="mv__reset">
        <button type="button" onClick={reset}>最初からやり直す</button>
      </p>
    </div>
  );
}
