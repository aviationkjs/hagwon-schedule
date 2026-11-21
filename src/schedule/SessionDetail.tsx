import type { ReactNode } from "react";
import type { ClassInfo, Group, Session } from "../data/types";
import { dateTimeLabel, hhmm } from "../lib/format";

type Props = {
  session: Session;
  cls: ClassInfo | undefined;
  groups: Group[];
  onClose: () => void;
  children?: ReactNode; // 변경 요청 영역
};

export function SessionDetail({ session, cls, groups, onClose, children }: Props) {
  const groupNames = groups.filter((g) => cls?.groupIds.includes(g.id)).map((g) => g.name);
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
    </div>
  );
}
