import { useState, type FormEvent } from "react";
import { repo, ACADEMY_ID, ROLE_LABEL, type Invite, type Role } from "../data";
import { normalizePhone } from "../domain/phone";
import { useLoad } from "../lib/useLoad";

type Draft = { name: string; phone: string; role: Role; studentIds: string[]; classIds: string[] };
const EMPTY: Draft = { name: "", phone: "", role: "parent", studentIds: [], classIds: [] };

/** 구성원 등록: 전화번호로 초대해 두면 그 사람이 Google 로그인 후 번호를 입력해 연결한다. */
export function MemberEditor() {
  const data = useLoad(async () => {
    const [invites, students, classes] = await Promise.all([
      repo.listInvites(ACADEMY_ID),
      repo.listStudents(ACADEMY_ID),
      repo.listClasses(ACADEMY_ID),
    ]);
    return { invites, students, classes };
  }, []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [error, setError] = useState("");

  const invites = data.data?.invites ?? [];
  const students = data.data?.students ?? [];
  const classes = data.data?.classes ?? [];

  const pickStudents = draft?.role === "parent" || draft?.role === "student";

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const phone = normalizePhone(draft.phone);
    if (!draft.name.trim() || !phone) return setError("이름과 휴대폰 번호를 확인하세요.");
    if (!editingPhone && invites.some((i) => i.phone === phone)) return setError("이미 등록된 번호입니다.");
    // 학부모·학생은 선택한 학생들의 수강 반을 볼 수 있다.
    const classIds = pickStudents
      ? [...new Set(students.filter((s) => draft.studentIds.includes(s.id)).flatMap((s) => s.classIds))]
      : draft.classIds;
    setError("");
    await repo.saveInvite(ACADEMY_ID, {
      phone,
      name: draft.name.trim(),
      role: draft.role,
      studentIds: pickStudents ? draft.studentIds : [],
      classIds,
    });
    setDraft(null);
    setEditingPhone(null);
    await data.reload();
  }

  const toggle = (list: string[], id: string, on: boolean) => (on ? [...list, id] : list.filter((x) => x !== id));

  return (
    <div className="stack">
      <p className="notice-box">
        등록한 번호의 주인이 Google로 로그인한 뒤 같은 번호를 입력하면 연결됩니다. 학생의 수강 반을 바꾼 뒤에는 학부모를
        '수정 → 저장'해야 볼 수 있는 반이 갱신됩니다.
      </p>
      <ul className="list">
        {invites.map((i: Invite) => (
          <li key={i.phone} className="card row">
            <span>
              <strong>{i.name}</strong> <span className="muted small">{ROLE_LABEL[i.role]} · {i.phone}</span>
            </span>
            <span className="row gap">
              <span className={i.claimedBy ? "badge ok" : "badge"}>{i.claimedBy ? "연결됨" : "로그인 전"}</span>
              <button
                className="btn"
                onClick={() => {
                  setEditingPhone(i.phone);
                  setDraft({ name: i.name, phone: i.phone, role: i.role, studentIds: i.studentIds, classIds: i.classIds });
                }}
              >
                수정
              </button>
            </span>
          </li>
        ))}
      </ul>
      {!draft && (
        <button className="btn primary" onClick={() => setDraft(EMPTY)}>
          구성원 등록
        </button>
      )}
      {draft && (
        <form className="card stack" onSubmit={save}>
          <h3>{editingPhone ? "구성원 수정" : "구성원 등록"}</h3>
          <label>
            이름
            <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label>
            휴대폰 번호
            <input className="input" inputMode="tel" disabled={Boolean(editingPhone)} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </label>
          <label>
            역할
            <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </label>
          {pickStudents ? (
            <fieldset>
              <legend>{draft.role === "parent" ? "자녀" : "본인"}</legend>
              {students.map((s) => (
                <label key={s.id} className="row gap small">
                  <input type="checkbox" checked={draft.studentIds.includes(s.id)} onChange={(e) => setDraft({ ...draft, studentIds: toggle(draft.studentIds, s.id, e.target.checked) })} />
                  {s.name}
                </label>
              ))}
            </fieldset>
          ) : (
            draft.role === "teacher" && (
              <fieldset>
                <legend>담당 반</legend>
                {classes.map((c) => (
                  <label key={c.id} className="row gap small">
                    <input type="checkbox" checked={draft.classIds.includes(c.id)} onChange={(e) => setDraft({ ...draft, classIds: toggle(draft.classIds, c.id, e.target.checked) })} />
                    {c.name}
                  </label>
                ))}
              </fieldset>
            )
          )}
          {error && <p className="error">{error}</p>}
          <div className="row gap">
            <button className="btn primary">저장</button>
            <button
              type="button"
              className="btn link"
              onClick={() => {
                setDraft(null);
                setEditingPhone(null);
              }}
            >
              취소
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
