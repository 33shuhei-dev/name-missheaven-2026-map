"use client";

import { useState } from "react";

const ITEMS = [
  "進捗バーを、1日に何度も開いてしまった",
  "お願いの文を、書いては消した",
  "「ごめんなさい」と思いながら、投稿した",
  "休みたいのに、休むのが怖かった",
  "数字が動かない日、自分を責めた",
  "眠れない、食欲がないなど、体にも影響が出ている",
] as const;

/** しんどさのセルフチェック。診断ではない。答えは、この画面の中だけで使い、どこにも送らない・保存しない */
export function SelfCheck() {
  const [on, setOn] = useState<boolean[]>(() => ITEMS.map(() => false));
  const n = on.filter(Boolean).length;
  const level = n <= 1 ? 0 : n <= 3 ? 1 : 2;
  const MSG = [
    { title: "ちょうどいい距離で、走れていたようです", body: "いまの距離感を、大事に。数字は、道具のひとつです。" },
    { title: "ちゃんと、がんばった7日間でした", body: "疲れが出ていて、当たり前です。今日は、数字から離れて、好きなことを、ひとつだけ。" },
    { title: "かなり、無理をしていたかもしれません", body: "まず、休むことを、いちばんにしてください。そして、誰かに話してみてください。つらさが続くときは、ひとりで抱えず、相談窓口があります。たとえば、よりそいホットライン（0120-279-338、24時間・無料。最新の案内は公式サイトで確認してください）。" },
  ] as const;
  return (
    <div className="selfcheck">
      <ul>
        {ITEMS.map((t, i) => (
          <li key={t}>
            <label>
              <input type="checkbox" checked={on[i]} onChange={() => setOn((cur) => cur.map((v, j) => (j === i ? !v : v)))} />
              <span>{t}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="selfcheck__count" aria-live="polite">あてはまった数：{n} / {ITEMS.length}</p>
      <div className="selfcheck__result" role="status">
        <strong>{MSG[level].title}</strong>
        <p>{MSG[level].body}</p>
      </div>
      <p className="selfcheck__note">診断ではありません。答えは、この画面の中だけで使い、どこにも送られず、保存もされません。</p>
    </div>
  );
}
