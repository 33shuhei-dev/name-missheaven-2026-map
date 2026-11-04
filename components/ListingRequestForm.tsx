"use client";

import { useState } from "react";
import { CONTACT_X_HANDLE, CONTACT_X_URL } from "@/lib/contact";

/**
 * 掲載依頼の文面を作ってコピーする。入力内容はどこにも送信・保存しない（コピーしてXのDMに貼ってもらう）。
 */
export function ListingRequestForm() {
  const [f, setF] = useState({ name: "", store: "", pref: "", division: "" });
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    setCopied(false);
  };
  const text = [
    "【ミスヘブン2026まとめ 掲載依頼】",
    `①名前：${f.name}`,
    `②お店・都道府県：${f.store}${f.pref ? `（${f.pref}）` : ""}`,
    `③部門：${f.division || "（分かれば）"}`,
    "④出場が分かるもの：在籍ページのスクリーンショットを添付します（リンクは貼りません）",
  ].join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
  }

  return (
    <div className="req-form">
      <label>
        <span>①名前（お店での表記）</span>
        <input value={f.name} onChange={set("name")} placeholder="例：いろは" autoComplete="off" />
      </label>
      <label>
        <span>②お店</span>
        <input value={f.store} onChange={set("store")} placeholder="例：THEOBROMA" autoComplete="off" />
      </label>
      <label>
        <span>都道府県</span>
        <input value={f.pref} onChange={set("pref")} placeholder="例：熊本県" autoComplete="off" />
      </label>
      <label>
        <span>③部門（分かれば）</span>
        <input value={f.division} onChange={set("division")} placeholder="例：ビジュアル部門" autoComplete="off" />
      </label>
      <pre className="req-form__preview" aria-label="DMに貼る文面">{text}</pre>
      <div className="req-form__actions">
        <button type="button" className="req-form__copy" onClick={copy}>
          {copied ? "コピーしました ✓" : "1. 依頼文をコピー"}
        </button>
        <a className="req-form__open" href={CONTACT_X_URL} target="_blank" rel="noopener noreferrer">
          2. {CONTACT_X_HANDLE} を開いてDMに貼る ↗
        </a>
      </div>
      {copied && (
        <p className="hint hint--tight" role="status">
          <strong>まだ送信されていません。</strong>XのDMに貼り、リンクは貼らずにスクリーンショットを添付してください。
        </p>
      )}
      <p className="hint hint--tight">アカウント凍結のリスクを避けるため、<strong>リンクは貼らず、在籍ページのスクリーンショット</strong>（「全国ミスヘブン総選挙2026」のバッジが写っているもの）をDMに添付してください。内容を確認して掲載します。入力した内容はこのサイトには送信・保存されません。コピーした文面をXのDMに貼って送ってください。</p>
    </div>
  );
}
