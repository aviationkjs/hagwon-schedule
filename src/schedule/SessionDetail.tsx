import { useState, type ReactNode } from "react";
import { ConfirmDelete } from "../admin/ConfirmDelete";
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
      {onDelete && (
        <button className="btn danger" onClick={() => setConfirming(true)}>
          이 수업 삭제
        </button>
      )}
      {confirming && onDelete && (
        <ConfirmDelete
          title="수업 삭제"
          text={`${cls?.name ?? "수업"} · ${dateTimeLabel(session.startAt)} 수업 하나만 지웁니다. 같은 반의 다른 날짜 수업은 남습니다.`}
          onCancel={() => setConfirming(false)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}
