import { useState, type FormEvent } from "react";
import { repo, ACADEMY_ID, type ClassInfo, type ClassInput } from "../data";
import { useLoad } from "../lib/useLoad";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const EMPTY: ClassInput = { name: "", teacherId: "", teacherName: "", room: "", groupIds: [] };

export function ClassEditor() {
  const data = useLoad(async () => {
    const [classes, groups, invites] = await Promise.all([
      repo.listClasses(ACADEMY_ID),
      repo.listGroups(ACADEMY_ID),
      repo.listInvites(ACADEMY_ID),
    ]);
    return { classes, groups, teachers: invites.filter((i) => i.role === "teacher" || i.role === "admin") };
  }, []);
  const [editing, setEditing] = useState<{ id?: string; value: ClassInput } | null>(null);
  const [scheduling, setScheduling] = useState<ClassInfo | null>(null);
  const [error, setError] = useState("");

  const classes = data.data?.classes ?? [];
  const groups = data.data?.groups ?? [];
  const teachers = data.data?.teachers ?? [];

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const v = editing.value;
    if (!v.name.trim()) return setError("반 이름을 입력하세요.");
    if (!v.teacherId) return setError("담당 강사를 고르세요. 강사는 '구성원'에서 등록하고, 앱에 한 번 로그인해야 고를 수 있습니다.");
    setError("");
    await repo.saveClass(ACADEMY_ID, { ...v, name: v.name.trim() }, editing.id);
    setEditing(null);
    await data.reload();
  }

  return (
    <div className="stack">
      <ul className="list">
        {classes.map((c) => (
          <li key={c.id} className="card">
            <div className="row">
              <strong>{c.name}</strong>
              <span className="muted small">
                {c.teacherName} · {c.room}
              </span>
            </div>
            <p className="small">
              {groups.filter((g) => c.groupIds.includes(g.id)).map((g) => g.name).join(", ") || "그룹 없음"}
            </p>
            <div className="row gap">
              <button className="btn" onClick={() => setEditing({ id: c.id, value: { ...EMPTY, ...c } })}>
                수정
              </button>
              <button className="btn" onClick={() => setScheduling(c)}>
                수업 일정 만들기
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!editing && (
        <button className="btn primary" onClick={() => setEditing({ value: EMPTY })}>
          반 추가
        </button>
      )}

      {editing && (
        <form className="card stack" onSubmit={save}>
          <h3>{editing.id ? "반 수정" : "새 반"}</h3>
          <label>
            반 이름
            <input className="input" value={editing.value.name} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, name: e.target.value } })} />
          </label>
          <label>
            담당 강사
            <select
              value={editing.value.teacherId}
              onChange={(e) => {
                const t = teachers.find((x) => x.claimedBy === e.target.value);
                setEditing({ ...editing, value: { ...editing.value, teacherId: e.target.value, teacherName: t?.name ?? "" } });
              }}
            >
              <option value="">선택</option>
              {teachers.map((t) => (
                <option key={t.phone} value={t.claimedBy ?? ""} disabled={!t.claimedBy}>
                  {t.name}
                  {t.claimedBy ? "" : " (로그인 전)"}
                </option>
              ))}
            </select>
          </label>
          <label>
            교실
            <input className="input" value={editing.value.room} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, room: e.target.value } })} />
          </label>
          <fieldset>
            <legend>대상 그룹 (여러 개 가능)</legend>
            {groups.map((g) => (
              <label key={g.id} className="row gap small">
                <input
                  type="checkbox"
                  checked={editing.value.groupIds.includes(g.id)}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      value: {
                        ...editing.value,
                        groupIds: e.target.checked
                          ? [...editing.value.groupIds, g.id]
                          : editing.value.groupIds.filter((x) => x !== g.id),
                      },
                    })
                  }
                />
                {g.name}
              </label>
            ))}
          </fieldset>
          {error && <p className="error">{error}</p>}
          <div className="row gap">
            <button className="btn primary">저장</button>
            <button type="button" className="btn link" onClick={() => setEditing(null)}>
              취소
            </button>
          </div>
        </form>
      )}

      {scheduling && <ScheduleMaker cls={scheduling} onClose={() => setScheduling(null)} />}
    </div>
  );
}

function ScheduleMaker({ cls, onClose }: { cls: ClassInfo; onClose: () => void }) {
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState("16:00");
  const [end, setEnd] = useState("17:30");
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [weeks, setWeeks] = useState(12);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const [y, m, d] = from.split("-").map(Number);
      const n = await repo.createWeeklySessions(ACADEMY_ID, cls, { weekday, start, end, from: new Date(y, m - 1, d), weeks });
      setMsg(`${n}개 수업을 만들었습니다.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card stack" onSubmit={create}>
      <h3>{cls.name} — 매주 반복 수업</h3>
      <label>
        요일
        <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
          {WEEKDAYS.map((w, i) => (
            <option key={w} value={i}>{w}요일</option>
          ))}
        </select>
      </label>
      <div className="row gap">
        <label>
          시작
          <input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          종료
          <input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      <div className="row gap">
        <label>
          시작일
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          주 수
          <input className="input" type="number" min={1} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
        </label>
      </div>
      {msg && <p className="muted">{msg}</p>}
      <div className="row gap">
        <button className="btn primary" disabled={busy}>
          만들기
        </button>
        <button type="button" className="btn link" onClick={onClose}>
          닫기
        </button>
      </div>
    </form>
  );
}
