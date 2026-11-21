import type { ClassInfo, Session } from "../data/types";
import { addDays } from "../domain/week";
import { dayLabel, hhmm, sameDay } from "../lib/format";

type Props = {
  weekStart: Date;
  sessions: Session[];
  classes: ClassInfo[];
  onSelect: (sessionId: string) => void;
};

/** 휴대폰 세로 화면 기준: 요일별로 위에서 아래로 쌓는다. */
export function WeekView({ weekStart, sessions, classes, onSelect }: Props) {
  const byId = new Map(classes.map((c) => [c.id, c]));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <div className="week">
      {days.map((day) => {
        const items = sessions.filter((s) => sameDay(s.startAt, day));
        const label = dayLabel(day);
        return (
          <section key={label} aria-label={label} className={`day ${sameDay(day, today) ? "today" : ""}`}>
            <h3 className="day-title">{label}</h3>
            {items.length === 0 ? (
              <p className="muted small">수업 없음</p>
            ) : (
              items.map((s) => {
                const cls = byId.get(s.classId);
                return (
                  <button key={s.id} className={`session ${s.status === "변경됨" ? "changed" : ""}`} onClick={() => onSelect(s.id)}>
                    <span className="time">
                      {hhmm(s.startAt)}–{hhmm(s.endAt)}
                    </span>
                    <span className="name">{cls?.name ?? "알 수 없는 반"}</span>
                    <span className="meta">
                      {s.room} · {cls?.teacherName ?? ""}
                      {s.status !== "예정" && <span className="badge">{s.status}</span>}
                    </span>
                  </button>
                );
              })
            )}
          </section>
        );
      })}
    </div>
  );
}
