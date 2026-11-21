import { useState, type FormEvent } from "react";
import { repo, ACADEMY_ID, type Student } from "../data";
import { gradeLabel, gradeOf } from "../domain/grade";
import { effectiveGroupId } from "../domain/group";
import { useLoad } from "../lib/useLoad";
import { ConfirmDelete } from "./ConfirmDelete";

type Draft = Omit<Student, "id">;
const EMPTY: Draft = { name: "", birthDate: "", overrideGroupId: null, overrideReason: "", classIds: [], photoConsent: false };

export function StudentEditor() {
  const data = useLoad(async () => {
    const [students, groups, classes] = await Promise.all([
      repo.listStudents(ACADEMY_ID),
      repo.listGroups(ACADEMY_ID),
      repo.listClasses(ACADEMY_ID),
    ]);
    return { students, groups, classes };
  }, []);
  const [editing, setEditing] = useState<{ id?: string; value: Draft } | null>(null);
  const [overriding, setOverriding] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const today = new Date();

  const students = data.data?.students ?? [];
  const groups = data.data?.groups ?? [];
  const classes = data.data?.classes ?? [];
  const groupName = (id: string | null) => groups.find((g) => g.id === id)?.name ?? "그룹 없음";

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const v = editing.value;
    if (!v.name.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(v.birthDate)) {
      setError("이름과 생년월일을 입력하세요.");
      return;
    }
    setError("");
    await repo.saveStudent(ACADEMY_ID, { ...v, name: v.name.trim() }, editing.id);
    setEditing(null);
    await data.reload();
  }

  return (
    <div className="stack">
      <ul className="list">
        {students.map((s) => {
          const grade = gradeOf(s.birthDate, today);
          return (
            <li key={s.id} className="card">
              <div className="row">
                <strong>{s.name}</strong>
                <span className="muted small">{grade ? gradeLabel(grade) : "학년 범위 밖"}</span>
              </div>
              <p className="small">
                그룹: {groupName(effectiveGroupId(s.birthDate, s.overrideGroupId, groups, today))}
                {s.overrideGroupId && <span className="badge">수동 · {s.overrideReason}</span>}
              </p>
              <p className="small muted">
                반: {classes.filter((c) => s.classIds.includes(c.id)).map((c) => c.name).join(", ") || "없음"}
              </p>
              <div className="row gap">
                <button className="btn" onClick={() => setEditing({ id: s.id, value: { ...EMPTY, ...s } })}>
                  수정
                </button>
                <button className="btn" onClick={() => setOverriding(s)}>
                  그룹 수동 지정
                </button>
                <button className="btn danger" onClick={() => setDeleting(s.id)}>
                  삭제
                </button>
              </div>
              {deleting === s.id && (
                <ConfirmDelete
                  text={`${s.name} 학생을 지웁니다. 연결된 학부모·학생 계정에서도 빠지고, 그 학부모가 볼 수 있는 반도 다시 계산됩니다. 되돌릴 수 없습니다.`}
                  onCancel={() => setDeleting(null)}
                  onConfirm={async () => {
                    await repo.deleteStudent(ACADEMY_ID, s.id);
                    setDeleting(null);
                    await data.reload();
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
      {!editing && (
        <button className="btn primary" onClick={() => setEditing({ value: EMPTY })}>
          학생 추가
        </button>
      )}

      {editing && (
        <form className="card stack" onSubmit={save}>
          <h3>{editing.id ? "학생 수정" : "새 학생"}</h3>
          <label>
            이름
            <input className="input" value={editing.value.name} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, name: e.target.value } })} />
          </label>
          <label>
            생년월일 (학년은 자동 계산)
            <input className="input" type="date" value={editing.value.birthDate} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, birthDate: e.target.value } })} />
          </label>
          <fieldset>
            <legend>수강 반</legend>
            {classes.map((c) => (
              <label key={c.id} className="row gap small">
                <input
                  type="checkbox"
                  checked={editing.value.classIds.includes(c.id)}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      value: {
                        ...editing.value,
                        classIds: e.target.checked ? [...editing.value.classIds, c.id] : editing.value.classIds.filter((x) => x !== c.id),
                      },
                    })
                  }
                />
                {c.name}
              </label>
            ))}
          </fieldset>
          <label className="row gap small">
            <input type="checkbox" checked={editing.value.photoConsent} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, photoConsent: e.target.checked } })} />
            사진·영상 홍보물 게시 동의
          </label>
          {error && <p className="error">{error}</p>}
          <div className="row gap">
            <button className="btn primary">저장</button>
            <button type="button" className="btn link" onClick={() => setEditing(null)}>
              취소
            </button>
          </div>
        </form>
      )}

      {overriding && (
        <OverrideForm
          student={overriding}
          groups={groups}
          onDone={async () => {
            setOverriding(null);
            await data.reload();
          }}
        />
      )}
    </div>
  );
}

function OverrideForm({ student, groups, onDone }: { student: Student; groups: { id: string; name: string }[]; onDone: () => void }) {
  const [groupId, setGroupId] = useState(student.overrideGroupId ?? "");
  const [reason, setReason] = useState(student.overrideReason);
  const [error, setError] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      await repo.setStudentGroupOverride(ACADEMY_ID, student.id, groupId || null, reason);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    }
  }

  return (
    <form className="card stack" onSubmit={save}>
      <h3>{student.name} — 그룹 수동 지정</h3>
      <select aria-label="지정할 그룹" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
        <option value="">자동 (생년 기준)</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      {groupId && <input className="input" placeholder="사유 (필수)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="수동 지정 사유" />}
      {error && <p className="error">{error}</p>}
      <div className="row gap">
        <button className="btn primary" disabled={Boolean(groupId) && !reason.trim()}>
          저장
        </button>
        <button type="button" className="btn link" onClick={onDone}>
          취소
        </button>
      </div>
    </form>
  );
}
