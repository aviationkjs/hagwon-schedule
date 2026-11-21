import { useState, type ReactNode } from "react";
import type { ClassInfo, Group, Session } from "../data/types";
import { dateTimeLabel, hhmm } from "../lib/format";

type Props = {
  session: Session;
  cls: ClassInfo | undefined;
  groups: Group[];
  onClose: () => void;
  /** 관리자만: 이 수업 삭제 */
  onDelete?: () => Promise<void>;
  children?: ReactNode; // 변경 요청 영역
};

export function SessionDetail({ session, cls, groups, onClose, onDelete, children }: Props) {
  const groupNames = groups.filter((g) => cls?.groupIds.includes(g.id)).map((g) => g.name);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    try {
      await onDelete!();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제하지 못했습니다.");
      setBusy(false);
    }
  }
  return (
    <div className="sheet" role="dialog" aria-label="수업 상세">
      <div className="sheet-head">
        <h2>{cls?.name ?? "수업"}</h2>
        <button className="btn link" onClick={onClose}>
          닫기
        </button>
      </div>
      <dl className="detail">
        <dt>시간</dt>
        <dd>
          {dateTimeLabel(session.startAt)} – {hhmm(session.endAt)}
        </dd>
        <dt>교실</dt>
        <dd>{session.room}</dd>
        <dt>강사</dt>
        <dd>{cls?.teacherName}</dd>
        <dt>대상</dt>
        <dd>{groupNames.join(", ") || "-"}</dd>
        <dt>상태</dt>
        <dd>{session.status}</dd>
      </dl>
      {children}
      {onDelete &&
        (confirming ? (
          <div className="stack">
            <p>이 날짜의 수업 하나만 지웁니다. 되돌릴 수 없습니다.</p>
            <div className="row gap">
              <button className="btn danger" disabled={busy} onClick={remove}>
                삭제
              </button>
              <button className="btn" onClick={() => setConfirming(false)}>
                취소
              </button>
            </div>
          </div>
        ) : (
          <button className="btn danger" onClick={() => setConfirming(true)}>
            이 수업 삭제
          </button>
        ))}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
