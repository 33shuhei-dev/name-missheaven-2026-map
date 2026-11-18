"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { YOSEN_BLOCKS } from "@/lib/yosen";

/**
 * 無限投票：投票をしているように見えるだけの、意味のないタップゲーム。
 * 本物の投票ではない。送信も、順位表も、実在の出場者の名前もない。保存は、遊んでいる端末の中だけ。
 */

const SAVE_KEY = "mugen-touhyou-v1";
const MAX_OFFLINE_SEC = 8 * 3600;
const BOOST_SEC = 30;
const SITE_URL = "https://name-missheaven-2026-map.vercel.app/game";

type Save = {
  votes: number; // 使える票
  totalVoters: number;
  totalVotes: number;
  taps: number;
  owned: Record<string, number>;
  seen: string[]; // 達成済みの実績
  savedAt: number;
  play: number; // 遊んだ秒数
  announced: boolean; // 発表ごっこを見たか
  sound: boolean; // 効果音（初期はオフ）
  pet: number; // マスコットをなでた回数
  gift: boolean; // ひみつの贈り物を受け取ったか
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
  { id: "tour", name: "全国ツアー", desc: "1秒に20人。買うたびに、ブロックが1つ光る", base: 20000, growth: 1.25 },
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

/** 実績を取ったときの、マスコットのひとこと */
const ACH_LINES: Record<string, string> = {
  a1: "最初の1人！ありがとう！",
  a3: "都道府県代表だよ！おめでとう！",
  a4: "ブロック代表！すごい！",
  a5: "日本代表！王冠をもらっちゃった！",
  a9: "7,634人ぶん！本選に進んだ人数と同じだよ",
  a11: "15万票！去年の1位の目安に並んだよ",
  a13: "倍率3倍！ここがいちばん上だよ",
  a15: "ぜんぶそろった！",
};
const TAP_LINES = ["その調子！", "もっとタップして！", "ぽちぽち、たのしいね", "わんわん！", "まだまだいけるよ"];
const PET_LINES = ["わん！", "くすぐったい…", "もっとなでて！", "しっぽがふれちゃう", "わんわん！"];

function fresh(): Save {
  return {
    votes: 0,
    totalVoters: 0,
    totalVotes: 0,
    taps: 0,
    owned: {},
    seen: [],
    savedAt: Date.now(),
    play: 0,
    announced: false,
    sound: false,
    pet: 0,
    gift: false,
  };
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

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}分`;
  return `${Math.floor(m / 60)}時間${m % 60}分`;
}

function derive(s: Save) {
  const o = s.owned;
  const perTap = 1 + (o.yobi ?? 0);
  const mult = 1 + (o.rate ?? 0);
  const thanks = Math.pow(1.25, o.thanks ?? 0);
  const autoVoters = ((o.oen ?? 0) * 1 + (o.tour ?? 0) * 20) * thanks;
  return { perTap, mult, autoVoters, autoVotes: autoVoters * mult, extraChairs: o.chair ?? 0, blocks: Math.min(YOSEN_BLOCKS.length, o.tour ?? 0) };
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

function titleOf(s: Save): string {
  if (s.seen.includes("a5")) return "日本代表（遊び）";
  if (s.seen.includes("a4")) return "ブロック代表（遊び）";
  if (s.seen.includes("a3")) return "都道府県代表（遊び）";
  return "修行中";
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new window.Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

/** 記録カード（画像）を作る。端末の中だけで作り、どこにも送らない */
async function makeCard(s: Save, playSec: number): Promise<string> {
  const W = 1200;
  const H = 675;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  if (!x) throw new Error("canvas");
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#14081f");
  g.addColorStop(1, "#2a1040");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  for (let i = 0; i < 18; i++) {
    x.fillStyle = i % 2 ? "rgba(255,111,183,0.16)" : "rgba(244,198,106,0.14)";
    x.beginPath();
    x.arc((i * 211) % W, (i * 137) % H, 30 + ((i * 29) % 70), 0, Math.PI * 2);
    x.fill();
  }
  try {
    const pic = await loadImg(`/game/${s.seen.includes("a5") ? "mascot-crown" : "mascot-happy"}.webp`);
    x.drawImage(pic, 40, 90, 480, 480);
  } catch {
    /* 画像が読めなくても、文字だけのカードにする */
  }
  const font = '"Noto Sans CJK JP","Hiragino Sans","Yu Gothic","Meiryo",sans-serif';
  x.textBaseline = "alphabetic";
  x.fillStyle = "#f4c66a";
  x.font = `900 72px ${font}`;
  x.fillText("無限投票", 540, 130);
  x.fillStyle = "#ff9ad0";
  x.font = `800 50px ${font}`;
  x.fillText(titleOf(s), 540, 205);
  x.fillStyle = "#ffffff";
  x.font = `700 44px ${font}`;
  const rows = [
    `投票した人　${fmt(s.totalVoters)}人`,
    `票　${fmt(s.totalVotes)}票`,
    `実績　${s.seen.length} / 15`,
    `遊んだ時間　${fmtTime(playSec)}`,
  ];
  rows.forEach((r, i) => x.fillText(r, 540, 290 + i * 70));
  x.fillStyle = "rgba(150,30,100,0.75)";
  x.strokeStyle = "#ff6fb7";
  x.lineWidth = 3;
  const bx = 160;
  const by = 600;
  const bw = 880;
  const bh = 56;
  x.beginPath();
  x.roundRect(bx, by, bw, bh, 28);
  x.fill();
  x.stroke();
  x.fillStyle = "#ffffff";
  x.font = `700 28px ${font}`;
  x.textAlign = "center";
  x.fillText("非公式のお遊び／本物の投票ではありません", W / 2, by + 38);
  x.textAlign = "start";
  return c.toDataURL("image/png");
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
  const [line, setLine] = useState("");
  const [star, setStar] = useState<{ id: number; top: number } | null>(null);
  const [boostLeft, setBoostLeft] = useState(0);
  const [announce, setAnnounce] = useState(0); // 0:なし 1:ドラムロール 2:発表
  const [card, setCard] = useState("");
  const [cardBusy, setCardBusy] = useState(false);
  const [bounce, setBounce] = useState(false);

  const lastTap = useRef(0);
  const popId = useRef(0);
  const starId = useRef(0);
  const boostUntil = useRef(0);
  const playRef = useRef(0);
  const lineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sRef = useRef(s);
  useEffect(() => {
    sRef.current = s;
  }, [s]);
  const frac = useRef(0);

  const d = useMemo(() => derive(s), [s]);

  const say = useCallback((text: string, ms = 3500) => {
    setLine(text);
    if (lineTimer.current) clearTimeout(lineTimer.current);
    lineTimer.current = setTimeout(() => setLine(""), ms);
  }, []);

  // 効果音（初期はオフ。ONにしたときだけ鳴る。ブラウザ内でその場で作る音で、ファイルは使わない）
  const sfx = useCallback((kind: "tap" | "buy" | "ach" | "star") => {
    if (!sRef.current.sound) return;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!ctxRef.current) ctxRef.current = new Ctor();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const notes: [number, number][] =
        kind === "tap"
          ? [[660, 0.05]]
          : kind === "buy"
            ? [[523, 0.08], [784, 0.1]]
            : kind === "star"
              ? [[880, 0.08], [1175, 0.08], [1568, 0.14]]
              : [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]];
      let t = ctx.currentTime;
      for (const [f, dur] of notes) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + dur + 0.02);
        t += dur * 0.9;
      }
    } catch {
      /* 音が出せない端末でも、遊べる */
    }
  }, []);

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
        setLine("おかえり！待ってたよ");
      }
      playRef.current = loaded.play;
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

  /** 実績が増えたら、ひとこと・音・発表ごっこ。イベントの中でだけ呼ぶ */
  const settle = useCallback(
    (prev: Save, next: Save): Save => {
      if (next.seen.length > prev.seen.length) {
        const id = next.seen[next.seen.length - 1];
        const a = ACHS.find((q) => q.id === id);
        say(ACH_LINES[id] ?? `「${a?.label ?? "実績"}」を達成！`, 4500);
        sfx("ach");
        if (id === "a15" && !next.announced) {
          setAnnounce(1);
          setTimeout(() => setAnnounce(2), 2400);
          return { ...next, announced: true };
        }
      }
      return next;
    },
    [say, sfx],
  );

  // 自動投票（0.1秒ごと）
  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => {
      const cur = sRef.current;
      const dv = derive(cur);
      const bm = Date.now() < boostUntil.current ? 10 : 1;
      let next = cur;
      if (document.visibilityState === "visible") playRef.current += 0.1;
      if (dv.autoVoters > 0) {
        frac.current += dv.autoVoters * 0.1;
        const whole = Math.floor(frac.current);
        if (whole > 0) {
          frac.current -= whole;
          next = {
            ...next,
            votes: next.votes + whole * dv.mult * bm,
            totalVoters: next.totalVoters + whole,
            totalVotes: next.totalVotes + whole * dv.mult * bm,
          };
        }
      }
      next = settle(cur, checkAch(next));
      if (next !== cur) {
        sRef.current = next;
        setS(next);
      }
      setBoostLeft(Math.max(0, Math.ceil((boostUntil.current - Date.now()) / 1000)));
    }, 100);
    return () => clearInterval(t);
  }, [ready, checkAch, settle]);

  // 保存
  useEffect(() => {
    if (!ready) return;
    const save = () => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ ...sRef.current, play: playRef.current, savedAt: Date.now() }));
      } catch {
        /* 保存できなくても、遊べる */
      }
    };
    const t = setInterval(save, 3000);
    const onHide = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(t);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onHide);
      save(); // サイト内で別のページへ移ったときも、そこまでの記録を残す
    };
  }, [ready]);

  // マスコットの様子：タップ中は大喜び、しばらく放っておくとねむる
  useEffect(() => {
    if (!ready) return;
    lastTap.current = Date.now();
    let was: "idle" | "happy" | "sleep" = "idle";
    const t = setInterval(() => {
      const dt = Date.now() - lastTap.current;
      const m = dt < 1200 ? "happy" : dt > 12000 ? "sleep" : "idle";
      if (m === "sleep" && was !== "sleep") say("…zzz", 4000);
      was = m;
      setMood(m);
    }, 400);
    return () => clearInterval(t);
  }, [ready, say]);

  // 金の流れ星：ときどき横切る。タップすると、30秒間だけ票が10倍
  useEffect(() => {
    if (!ready) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(
        () => {
          if (document.visibilityState === "visible") {
            const id = ++starId.current;
            setStar({ id, top: 8 + Math.random() * 40 });
            setTimeout(() => setStar((cur) => (cur && cur.id === id ? null : cur)), 7000);
          }
          schedule();
        },
        40000 + Math.random() * 40000,
      );
    };
    schedule();
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const tap = (e: React.PointerEvent | React.KeyboardEvent) => {
    const cur = sRef.current;
    const dv = derive(cur);
    const bm = Date.now() < boostUntil.current ? 10 : 1;
    const gain = dv.perTap;
    const next = settle(
      cur,
      checkAch({
        ...cur,
        votes: cur.votes + gain * dv.mult * bm,
        totalVoters: cur.totalVoters + gain,
        totalVotes: cur.totalVotes + gain * dv.mult * bm,
        taps: cur.taps + 1,
      }),
    );
    sRef.current = next;
    setS(next);
    lastTap.current = Date.now();
    setMood("happy");
    sfx("tap");
    if (next.taps % 60 === 0) say(TAP_LINES[(next.taps / 60) % TAP_LINES.length]);
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
    setPops((p) => [...p.slice(-14), { id, x, y, text: `+${fmt(gain * dv.mult * bm)}票` }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 800);
  };

  const buy = (u: Upgrade) => {
    const cur = sRef.current;
    const n = cur.owned[u.id] ?? 0;
    if (u.max !== undefined && n >= u.max) return;
    const c = costOf(u, n);
    if (cur.votes < c) return;
    const bought = settle(cur, checkAch({ ...cur, votes: cur.votes - c, owned: { ...cur.owned, [u.id]: n + 1 } }));
    sRef.current = bought;
    setS(bought);
    sfx("buy");
    if (u.id === "tour" && n < YOSEN_BLOCKS.length) say(`${YOSEN_BLOCKS[n].name}に、ツアーが届いたよ！`, 3500);
  };

  const catchStar = () => {
    setStar(null);
    boostUntil.current = Date.now() + BOOST_SEC * 1000;
    setBoostLeft(BOOST_SEC);
    say(`金の流れ星！${BOOST_SEC}秒間、票が10倍！`, 4000);
    sfx("star");
  };

  const pet = () => {
    const cur = sRef.current;
    const n = cur.pet + 1;
    let next: Save = { ...cur, pet: n };
    if (n >= 30 && !cur.gift) {
      next = { ...next, gift: true, votes: next.votes + 500, totalVotes: next.totalVotes + 500 };
      say("ひみつの贈り物！500票あげる。なでてくれてありがとう", 5000);
      sfx("star");
    } else {
      say(PET_LINES[n % PET_LINES.length], 2000);
    }
    sRef.current = next;
    setS(next);
    setBounce(true);
    setTimeout(() => setBounce(false), 300);
  };

  const toggleSound = () => {
    const cur = sRef.current;
    const next = { ...cur, sound: !cur.sound };
    sRef.current = next;
    setS(next);
    if (next.sound) sfx("buy");
  };

  const buildCard = async () => {
    setCardBusy(true);
    try {
      setCard(await makeCard(sRef.current, playRef.current));
    } catch {
      setToast("カードを作れませんでした。もう一度お試しください。");
    } finally {
      setCardBusy(false);
    }
  };

  const shareCard = async () => {
    try {
      const blob = await dataUrlToBlob(card);
      const file = new File([blob], "mugen-touhyou.png", { type: "image/png" });
      const text = `無限投票で${fmt(sRef.current.totalVotes)}票！（非公式のお遊び）\n${SITE_URL}\n#総選挙`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        setToast("この端末では共有できません。画像を長押しして保存してください。");
      }
    } catch {
      /* 共有をやめた場合など */
    }
  };

  const reset = () => {
    if (!window.confirm("最初からやり直します。よろしいですか？")) return;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* 何もしない */
    }
    frac.current = 0;
    playRef.current = 0;
    boostUntil.current = 0;
    const f = fresh();
    sRef.current = f;
    setS(f);
    setTickets(50);
    setCard("");
    setLine("");
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
        {boostLeft > 0 ? <p className="mv__boost" role="status">金の流れ星ブースト：票が10倍（あと{boostLeft}秒）</p> : null}

        <div className="mv__mascot">
          {line ? <p className="mv__bubble" aria-hidden="true">{line}</p> : null}
          <button type="button" className={bounce ? "mv__mascot-btn is-bounce" : "mv__mascot-btn"} aria-label="マスコットをなでる（おまけ）" onClick={pet}>
            <Image src={`/game/${mascot}.webp`} alt="" width={480} height={480} unoptimized draggable={false} />
          </button>
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

        {star ? (
          <button type="button" key={star.id} className="mv__star" style={{ top: `${star.top}%` }} aria-label="金の流れ星（タップすると、30秒間、票が10倍）" onClick={catchStar}>
            <Image src="/game/spark.webp" alt="" width={72} height={72} unoptimized draggable={false} />
          </button>
        ) : null}
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
      <p className="mv__tools">
        <button type="button" className="mv__sound" aria-pressed={s.sound} onClick={toggleSound}>
          効果音：{s.sound ? "ON" : "OFF"}
        </button>
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

      <section className="mv__blocks" aria-label="全国ツアー">
        <h2>全国ツアー（{d.blocks} / {YOSEN_BLOCKS.length} ブロック）</h2>
        <ul>
          {YOSEN_BLOCKS.map((b, i) => (
            <li key={b.name} className={i < d.blocks ? "is-on" : ""}>
              {i < d.blocks ? b.name : "？？？"}
            </li>
          ))}
        </ul>
        <p className="mv__blocks-note">「全国ツアー」を買うたびに、ブロックが1つ光ります。</p>
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
        {s.announced ? (
          <p className="mv__again">
            <button
              type="button"
              onClick={() => {
                setAnnounce(1);
                setTimeout(() => setAnnounce(2), 2400);
              }}
            >
              発表ごっこをもう一度見る
            </button>
          </p>
        ) : null}
      </section>

      <section className="mv__share" aria-label="記録カード">
        <h2>記録カード</h2>
        <p className="mv__share-note">いまの記録を、画像にします。画像は、この端末の中で作られ、どこにも送られません。</p>
        <p>
          <button type="button" className="mv__share-btn" onClick={buildCard} disabled={cardBusy || !ready}>
            {cardBusy ? "作っています…" : "記録カードを作る"}
          </button>
        </p>
        {card ? (
          <div className="mv__card">
            <Image src={card} alt={`記録カード。${titleOf(s)}、${fmt(s.totalVotes)}票。非公式のお遊びです。`} width={1200} height={675} unoptimized />
            <p>
              <a className="mv__share-btn" href={card} download="mugen-touhyou.png">画像を保存</a>
              <button type="button" className="mv__share-btn" onClick={shareCard}>共有する</button>
            </p>
            <small>共有に対応していない端末では、画像を長押しして保存してください。</small>
          </div>
        ) : null}
      </section>

      {toast ? <p className="mv__toast" role="status">{toast}</p> : null}

      <p className="mv__fine">
        非公式・有志のお遊びです。公式とは関係ありません。実在の出場者の名前や、実際の票数は使っていません。保存は、この端末の中だけです。
      </p>
      <p className="mv__reset">
        <button type="button" onClick={reset}>最初からやり直す</button>
      </p>

      {announce > 0 ? (
        <div className="mv__announce" role="dialog" aria-modal="true" aria-label="発表ごっこ">
          {announce === 1 ? (
            <p className="mv__announce-drum">結果を発表します…</p>
          ) : (
            <div className="mv__announce-main">
              <Image src="/game/mascot-crown.webp" alt="" width={480} height={480} unoptimized draggable={false} />
              <p className="mv__announce-big">神15に選ばれました！</p>
              <p className="mv__announce-note">※遊びです。本物の結果ではありません。</p>
              <button type="button" onClick={() => setAnnounce(0)} autoFocus>
                閉じる
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const bin = atob(dataUrl.split(",")[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: "image/png" });
}
