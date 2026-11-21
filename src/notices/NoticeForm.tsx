import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { repo, ACADEMY_ID, type Board, type ClassInfo, type Group, type NoticeTarget, type Student } from "../data";

type Props = { board: Board; groups: Group[]; classes: ClassInfo[]; students: Student[]; onDone: () => void };
type Kind = NoticeTarget["kind"];

export function NoticeForm({ board, groups, classes, students, onDone }: Props) {
  const { profile } = useAuth();
  const isAdmin = profile!.role === "admin";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [targetId, setTargetId] = useState("");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const options: Record<Exclude<Kind, "all">, { id: string; name: string }[]> = {
    group: groups,
    class: classes,
    student: students,
  };

  function target(): NoticeTarget | null {
    if (!isAdmin || kind === "all") return { kind: "all" };
    if (!targetId) return null;
    if (kind === "group") return { kind, groupId: targetId };
    if (kind === "class") return { kind, classId: targetId };
    return { kind, studentId: targetId };
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const t = target();
    if (!title.trim() || !body.trim() || !t) {
      setError("제목, 내용, 대상을 확인하세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await repo.createNotice(ACADEMY_ID, {
        board,
        authorUid: profile!.uid,
        authorName: profile!.name,
        title: title.trim(),
        body: body.trim(),
        target: t,
        pinned: isAdmin && pinned,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "올리지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <h3>{board === "공지" ? "공지 쓰기" : "의견 쓰기"}</h3>
      <input className="input" placeholder="제목" aria-label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input" rows={5} placeholder="내용" aria-label="내용" value={body} onChange={(e) => setBody(e.target.value)} />
      {isAdmin && (
        <>
          <label>
            대상
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as Kind);
                setTargetId("");
              }}
            >
              <option value="all">전체</option>
              <option value="group">그룹</option>
              <option value="class">반</option>
              <option value="student">학생</option>
            </select>
          </label>
          {kind !== "all" && (
            <select aria-label="대상 선택" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              <option value="">선택</option>
              {options[kind].map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
          {kind !== "all" && (
            <p className="muted small">
              대상 지정 글은 화면에서 걸러 보여 줍니다. 같은 학원 구성원은 기술적으로 읽을 수 있으니 성적·상담 같은 민감한
              내용은 쓰지 마세요.
            </p>
          )}
          <label className="row gap small">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            상단 고정
          </label>
        </>
      )}
      {error && <p className="error">{error}</p>}
      <div className="row gap">
        <button className="btn primary" disabled={busy}>
          올리기
        </button>
        <button type="button" className="btn link" onClick={onDone}>
          취소
        </button>
      </div>
    </form>
  );
}
