"use client";
import { useEffect, useRef, useState } from "react";

/** Kept export name for compatibility with the existing homepage. */
export function VoteAudioPlayer() {
  const [open, setOpen] = useState(false);
  const mvUrl = process.env.NEXT_PUBLIC_VOTE_MV_URL?.trim() || "";
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { videoRef.current?.pause(); setOpen(false); }
      if (event.key === "Tab") {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button, video");
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onEscape); previousFocus?.focus(); };
  }, [open]);
  function close() { videoRef.current?.pause(); setOpen(false); }
  return <>
    <div className="vote-player vote-mv-launcher">
      <button className="vote-player__button" type="button" onClick={() => setOpen(true)} disabled={!mvUrl} aria-label="歌詞付きミュージックビデオを見る">▶</button>
      <div className="vote-player__center"><strong>VOTE VOTE VOTE</strong><small>LYRIC MV · 映像と音楽を再生</small></div>
      <button className="vote-mv-launcher__watch" type="button" onClick={() => setOpen(true)} disabled={!mvUrl}>{mvUrl ? "MVを見る ↗" : "MV準備中"}</button>
    </div>
    {open && mvUrl && <div className="vote-mv-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <section ref={dialogRef} className="vote-mv-dialog" role="dialog" aria-modal="true" aria-label="VOTE VOTE VOTE 歌詞付きミュージックビデオ">
        <div className="vote-mv-dialog__top"><strong>VOTE VOTE VOTE · LYRIC MV</strong><button type="button" onClick={close} aria-label="動画を閉じる">✕ 閉じる</button></div>
        <video ref={videoRef} tabIndex={0} className="vote-mv-video" src={mvUrl} controls playsInline preload="none" aria-label="VOTE VOTE VOTE 歌詞付きMV" />
        <p className="vote-mv-dialog__hint">音が出ない場合は、動画の音量ボタンを確認してください。</p>
      </section>
    </div>}
  </>;
}
