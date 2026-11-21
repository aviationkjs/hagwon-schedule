import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { repo, ACADEMY_ID, type Session } from "../data";
import { toLocalInput } from "../lib/format";

/** 수업 상세 아래에 붙는 '변경 요청' 접이식 폼 */
export function RequestForm({ session, onDone }: { session: Session; onDone: () => void }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(toLocalInput(session.startAt));
  const [end, setEnd] = useState(toLocalInput(session.endAt));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return (
      <button className="btn primary block" onClick={() => setOpen(true)}>
        변경 요청
      </button>
    );
  }

  const desiredStart = new Date(start);
  const desiredEnd = new Date(end);
  const valid = reason.trim() !== "" && !isNaN(desiredStart.getTime()) && desiredEnd > desiredStart;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid || !profile) return;
    setBusy(true);
    setError("");
    try {
      await repo.createRequest(ACADEMY_ID, {
        sessionId: session.id,
        classId: session.classId,
        requesterUid: profile.uid,
        requesterName: profile.name,
        reason: reason.trim(),
        desiredStart,
        desiredEnd,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청을 보내지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <h3>변경 요청</h3>
      <label>
        희망 시작
        <input className="input" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
      </label>
      <label>
        희망 종료
        <input className="input" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
      </label>
      <label>
        사유
        <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      {desiredEnd <= desiredStart && <p className="error small">종료가 시작보다 늦어야 합니다.</p>}
      <p className="muted small">관리자가 확인한 뒤 반영 여부를 알려 드립니다. (7일 안에 답장)</p>
      <button className="btn primary" disabled={!valid || busy}>
        요청 보내기
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
