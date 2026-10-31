"use client";

import { useEffect, useState } from "react";
import { BLOCK_CONDITION, GRANDPRIX_NOTE, SCHEDULE, SCHEDULE_OFFICIAL_NOTE, SCHEDULE_SOURCE, currentStatus } from "@/lib/schedule";
import { ExternalLink } from "@/components/ExternalLink";

/** 大会の日程と「いまどの期間か」。現在の状況は閲覧時の時刻で表示する（静的生成の時刻ではない） */
export function SchedulePanel() {
  const [status, setStatus] = useState<ReturnType<typeof currentStatus> | null>(null);
  useEffect(() => {
    const update = () => setStatus(currentStatus(new Date()));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="schedule" aria-labelledby="schedule-heading">
      <h2 id="schedule-heading" className="schedule__title">大会の日程</h2>
      {status && <p className="schedule__now">{status.text}</p>}
      <ul className="schedule__list">
        {SCHEDULE.map((p) => (
          <li key={p.id} className={status?.phaseId === p.id ? "schedule__item schedule__item--now" : "schedule__item"}>
            <span className="schedule__name">{p.name}</span>
            <span className="schedule__date">
              {p.startLabel} 〜 {p.endLabel}
            </span>
          </li>
        ))}
      </ul>
      <p className="hint hint--tight">
        本選への進出条件：{BLOCK_CONDITION}。{GRANDPRIX_NOTE}。
      </p>
      <p className="hint hint--tight">{SCHEDULE_OFFICIAL_NOTE}。</p>
      <p className="schedule__src">
        出典：<ExternalLink href={SCHEDULE_SOURCE.url} label={SCHEDULE_SOURCE.label} />
      </p>
    </section>
  );
}
