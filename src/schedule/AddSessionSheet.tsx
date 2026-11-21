import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { repo, ACADEMY_ID, type ClassInfo } from "../data";
import { endAfterStart, minEndTime } from "../domain/time";
import { hhmm } from "../lib/format";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const dateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type Props = {
  classes: ClassInfo[];
  start: Date;
  end: Date;
  onClose: () => void;
  onSaved: () => void;
};

/** 관리자: 캘린더에서 고른 시간에 수업을 넣는다. '매주 반복'이면 같은 요일·시간으로 여러 주를 만든다. */
export function AddSessionSheet({ classes, start, end, onClose, onSaved }: Props) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [date, setDate] = useState(dateInput(start));
  const [from, setFrom] = useState(hhmm(start));
  const [to, setTo] = useState(hhmm(end));
  const [weeks, setWeeks] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d);

  async function save(e: FormEvent) {
    e.preventDefault();
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return setError("반을 고르세요.");
    if (to <= from) return setError("끝나는 시간이 시작보다 늦어야 합니다.");
    setBusy(true);
    setError("");
    try {
      await repo.createWeeklySessions(ACADEMY_ID, cls, { weekday: day.getDay(), start: from, end: to, from: day, weeks });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet" role="dialog" aria-label="수업 추가">
      <div className="sheet-head">
        <h2>수업 추가</h2>
        <button className="btn link" onClick={onClose}>
          닫기
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="stack">
          <p>수업을 넣으려면 먼저 반을 만들어야 합니다.</p>
          <Link className="btn primary" to="/admin?tab=class">
            반 만들러 가기
          </Link>
        </div>
      ) : (
        <form className="stack" onSubmit={save}>
          <label>
            반
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.teacherName} · {c.room}
                </option>
              ))}
            </select>
          </label>
          <label>
            날짜
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <div className="two-col">
            <label>
              시작
              <input
                className="input"
                type="time"
                value={from}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setTo(endAfterStart(from, to, e.target.value)); // 수업 길이를 유지해 종료도 옮긴다
                  setFrom(e.target.value);
                }}
              />
            </label>
            <label>
              끝
              <input className="input" type="time" min={minEndTime(from)} value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
          {to <= from && <p className="error small">끝나는 시간은 시작({from}) 이후로만 정할 수 있습니다.</p>}
          <label>
            반복
            <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
              <option value={1}>한 번만</option>
              {[4, 8, 12, 16, 24].map((n) => (
                <option key={n} value={n}>
                  매주 {WEEKDAYS[day.getDay()]}요일, {n}주
                </option>
              ))}
            </select>
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={busy || to <= from}>
            {weeks === 1 ? "수업 추가" : `수업 ${weeks}개 추가`}
          </button>
        </form>
      )}
    </div>
  );
}
