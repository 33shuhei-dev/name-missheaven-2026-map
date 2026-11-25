"use client";

import { useState } from "react";

const GOOD = [
  "数字が増えて、うれしかった日があった",
  "「ありがとう」を、言ったり、言われたりした",
  "応援してくれる人の存在に、助けられた",
  "楽しいと思えた瞬間があった",
] as const;

const TIRED = [
  "進捗バーを、何度も開いてしまった",
  "お願いの文を、書いては消した",
  "休むのが、怖かった",
  "眠れない、食欲がないなど、体にも影響が出た",
] as const;

/** 7日間のふりかえりチェック。診断ではない。答えは、この画面の中だけで使い、どこにも送らない・保存しない */
export function SelfCheck() {
  const [good, setGood] = useState<boolean[]>(() => GOOD.map(() => false));
  const [tired, setTired] = useState<boolean[]>(() => TIRED.map(() => false));
  const g = good.filter(Boolean).length;
  const t = tired.filter(Boolean).length;
  let title: string;
  let body: string;
  if (t >= 3) {
    title = "かなり、がんばった7日間でした";
    body = "疲れが出ていて、当たり前です。まず、休むことを、いちばんに。そして、誰かに話してみてください。つらさが続くときは、ひとりで抱えず、相談窓口があります。たとえば、よりそいホットライン（0120-279-338、24時間・無料。最新の案内は公式サイトで確認してください）。";
  } else if (g >= 2) {
    title = "うれしい7日間でしたね";
    body = "その気持ち、大事に持っていてください。疲れが出てきたら、ゆっくり休んで。楽しかったなら、それは、もう、勝ちです。";
  } else {
    title = "ちょうどいい距離で、走れていたようです";
    body = "いまの距離感を、大事に。数字は、道具のひとつです。うれしかったことを、ひとつ、思い出してみてください。";
  }
  const toggle = (set: React.Dispatch<React.SetStateAction<boolean[]>>, i: number) => set((cur) => cur.map((v, j) => (j === i ? !v : v)));
  return (
    <div className="selfcheck">
      <fieldset>
        <legend>うれしかったこと</legend>
        <ul>
          {GOOD.map((x, i) => (
            <li key={x}>
              <label>
                <input type="checkbox" checked={good[i]} onChange={() => toggle(setGood, i)} />
                <span>{x}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <fieldset>
        <legend>しんどかったこと</legend>
        <ul>
          {TIRED.map((x, i) => (
            <li key={x}>
              <label>
                <input type="checkbox" checked={tired[i]} onChange={() => toggle(setTired, i)} />
                <span>{x}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <p className="selfcheck__count" aria-live="polite">うれしかったこと：{g} / {GOOD.length}　しんどかったこと：{t} / {TIRED.length}</p>
      <div className="selfcheck__result" role="status">
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
      <p className="selfcheck__note">診断ではありません。答えは、この画面の中だけで使い、どこにも送られず、保存もされません。</p>
    </div>
  );
}
