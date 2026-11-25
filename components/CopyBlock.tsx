"use client";

import { useState } from "react";

/** コピーできる文例。端末の中だけで動き、どこにも送らない */
export function CopyBlock({ title, text, note }: { title: string; text: string; note?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // クリップボードが使えない端末では、選択して手でコピーしてもらう
      const el = document.getElementById(`cb-${title}`);
      if (el) {
        const r = document.createRange();
        r.selectNodeContents(el);
        const s = window.getSelection();
        s?.removeAllRanges();
        s?.addRange(r);
      }
    }
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  };
  return (
    <div className="copyblock">
      <div className="copyblock__head">
        <strong>{title}</strong>
        <button type="button" onClick={copy} aria-live="polite">{done ? "コピーしました" : "コピー"}</button>
      </div>
      <pre id={`cb-${title}`} className="copyblock__text">{text}</pre>
      {note ? <p className="copyblock__note">{note}</p> : null}
    </div>
  );
}
