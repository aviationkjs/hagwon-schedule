import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { repo, ACADEMY_ID, type ClassInfo, type ClassInput } from "../data";
import { useLoad } from "../lib/useLoad";
import { classHue, HUE_LABEL, HUES } from "../schedule/calendar";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function ClassEditor() {
  const { profile } = useAuth();
  const me = profile!;
  const data = useLoad(async () => {
    const [classes, groups, invites] = await Promise.all([
      repo.listClasses(ACADEMY_ID),
      repo.listGroups(ACADEMY_ID),
      repo.listInvites(ACADEMY_ID),
    ]);
    return { classes, groups, invites };
  }, []);
  const [editing, setEditing] = useState<{ id?: string; value: ClassInput } | null>(null);
  const [scheduling, setScheduling] = useState<ClassInfo | null>(null);
  const [error, setError] = useState("");
  const [savedName, setSavedName] = useState("");

  const classes = data.data?.classes ?? [];
  const groups = data.data?.groups ?? [];
  // 담당 강사 후보: 나 + 앱에 로그인해 연결된 강사·관리자
  const teachers = [
    { uid: me.uid, name: `${me.name} (나)` },
    ...(data.data?.invites ?? [])
      .filter((i) => (i.role === "teacher" || i.role === "admin") && i.claimedBy && i.claimedBy !== me.uid)
      .map((i) => ({ uid: i.claimedBy!, name: i.name })),
  ];
  const waiting = (data.data?.invites ?? []).filter((i) => i.role === "teacher" && !i.claimedBy);
  const empty = (): ClassInput => ({ name: "", teacherId: me.uid, teacherName: me.name, room: "", groupIds: [] });

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const v = editing.value;
    if (!v.name.trim()) return setError("반 이름을 입력하세요.");
    setError("");
    await repo.saveClass(ACADEMY_ID, { ...v, name: v.name.trim() }, editing.id);
    setSavedName(editing.id ? "" : v.name.trim());
    setEditing(null);
    await data.reload();
  }

  return (
    <div className="stack">
      {savedName && (
        <p className="notice-box">
          '{savedName}' 반을 만들었습니다. 이제 <Link to="/schedule">스케줄</Link>에서 빈 시간을 누르거나 '+ 수업'으로 수업
          시간을 넣으세요.
        </p>
      )}
      <ul className="list">
        {classes.map((c) => (
          <li key={c.id} className="card">
            <div className="row">
              <strong>
                <span className={`swatch hue-${classHue(c)}`} aria-hidden /> {c.name}
              </strong>
              <span className="muted small">
                {c.teacherName} · {c.room}
              </span>
            </div>
            <p className="small">
              {groups.filter((g) => c.groupIds.includes(g.id)).map((g) => g.name).join(", ") || "그룹 없음"}
            </p>
            <div className="row gap">
              <button className="btn" onClick={() => setEditing({ id: c.id, value: { ...empty(), ...c } })}>
                수정
              </button>
              <button className="btn" onClick={() => setScheduling(c)}>
                매주 반복 수업 넣기
              </button>
            </div>
          </li>
        ))}
      </ul>
      {classes.length === 0 && !editing && <p className="muted">아직 반이 없습니다. 반을 만든 뒤 스케줄에서 수업 시간을 넣습니다.</p>}
      {!editing && (
        <button className="btn primary" onClick={() => setEditing({ value: empty() })}>
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
                const t = teachers.find((x) => x.uid === e.target.value);
                const name = t?.uid === me.uid ? me.name : (t?.name ?? "");
                setEditing({ ...editing, value: { ...editing.value, teacherId: e.target.value, teacherName: name } });
              }}
            >
              {teachers.map((t) => (
                <option key={t.uid} value={t.uid}>
                  {t.name}
                </option>
              ))}
            </select>
            {waiting.length > 0 && (
              <span className="muted small">
                아직 로그인하지 않은 강사({waiting.map((w) => w.name).join(", ")})는 로그인한 뒤에 고를 수 있습니다.
              </span>
            )}
          </label>
          <fieldset>
            <legend>캘린더 색</legend>
            <div className="swatches" role="radiogroup" aria-label="캘린더 색">
              {HUES.filter((h) => h !== "gray").map((h) => {
                const current = editing.value.color ?? classHue({ id: editing.id ?? "new", ...editing.value });
                return (
                  <button
                    type="button"
                    key={h}
                    role="radio"
                    aria-checked={current === h}
                    aria-label={HUE_LABEL[h]}
                    title={HUE_LABEL[h]}
                    className={`swatch-btn hue-${h} ${current === h ? "on" : ""}`}
                    onClick={() => setEditing({ ...editing, value: { ...editing.value, color: h } })}
                  />
                );
              })}
            </div>
          </fieldset>
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
