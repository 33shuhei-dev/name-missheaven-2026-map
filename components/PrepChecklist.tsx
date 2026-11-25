"use client";

import { useEffect, useState } from "react";

const KEY = "shuppan-prep-v1";

export type PrepItem = { id: string; label: string; hint?: string };

/** 備えのチェックリスト。チェックは、この端末の中（ブラウザ）だけに保存する */
export function PrepChecklist({ items }: { items: readonly PrepItem[] }) {
  const [on, setOn] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) setOn(JSON.parse(raw) as Record<string, boolean>);
      } catch {
        /* 保存が使えなくても、チェックはできる */
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);
  const toggle = (id: string) => {
    setOn((cur) => {
      const next = { ...cur, [id]: !cur[id] };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* 何もしない */
      }
      return next;
    });
  };
  const done = items.filter((i) => on[i.id]).length;
  return (
    <div className="prep">
      <p className="prep__count" aria-live="polite">できた：{done} / {items.length}</p>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            <label>
              <input type="checkbox" checked={!!on[i.id]} onChange={() => toggle(i.id)} />
              <span>
                <b>{i.label}</b>
                {i.hint ? <small>{i.hint}</small> : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="prep__note">チェックは、この端末のブラウザの中だけに保存されます。どこにも送られません。</p>
    </div>
  );
}
