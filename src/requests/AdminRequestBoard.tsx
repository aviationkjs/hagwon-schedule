import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { repo, ACADEMY_ID, type ChangeRequest } from "../data";
import { isOverdue, REQUEST_STATUSES, type RequestStatus } from "../domain/request";
import { dateTimeLabel, hhmm } from "../lib/format";
import { useLoad } from "../lib/useLoad";

/** 관리자: 상태별 요청 목록과 처리 버튼 */
export function AdminRequestBoard() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<RequestStatus>("접수");
  const { data, error, loading, reload } = useLoad(() => repo.listRequests(ACADEMY_ID), []);
  const all = data ?? [];
  const now = new Date();

  return (
    <div>
      <div className="tabs" role="tablist">
        {REQUEST_STATUSES.map((s) => {
          const count = all.filter((r) => r.status === s).length;
          return (
            <button key={s} role="tab" aria-selected={tab === s} className={tab === s ? "tab active" : "tab"} onClick={() => setTab(s)}>
              {s} {count > 0 && <span className="count">{count}</span>}
            </button>
          );
        })}
      </div>
      {loading && <p className="muted">불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      <ul className="list">
        {all
          .filter((r) => r.status === tab)
          .map((r) => (
            <RequestCard key={r.id} req={r} overdue={isOverdue(r, now)} actorUid={profile!.uid} onChanged={reload} />
          ))}
      </ul>
      {!loading && all.filter((r) => r.status === tab).length === 0 && <p className="muted">해당하는 요청이 없습니다.</p>}
    </div>
  );
}

function RequestCard({
  req,
  overdue,
  actorUid,
  onChanged,
}: {
  req: ChangeRequest;
  overdue: boolean;
  actorUid: string;
  onChanged: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function change(to: RequestStatus, why = "") {
    setBusy(true);
    setError("");
    try {
      await repo.changeRequestStatus(ACADEMY_ID, req.id, to, actorUid, why);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="card">
      <div className="row">
        <strong>{req.requesterName}</strong>
        {overdue && <span className="badge warn">7일 초과</span>}
      </div>
      <p>
        희망: {dateTimeLabel(req.desiredStart)}–{hhmm(req.desiredEnd)}
      </p>
      <p>{req.reason}</p>
      <p className="muted small">접수 {dateTimeLabel(req.createdAt)}</p>
      {req.handleReason && <p className="muted small">처리 메모: {req.handleReason}</p>}

      {(req.status === "접수" || req.status === "검토 중") && !rejecting && (
        <div className="row gap">
          {req.status === "접수" && (
            <button className="btn" disabled={busy} onClick={() => change("검토 중")}>
              검토 시작
            </button>
          )}
          {req.status === "검토 중" && (
            <button className="btn primary" disabled={busy} onClick={() => change("반영")}>
              반영 (일정 변경)
            </button>
          )}
          <button className="btn danger" disabled={busy} onClick={() => setRejecting(true)}>
            반려
          </button>
        </div>
      )}
      {rejecting && (
        <div className="stack">
          <input className="input" placeholder="반려 사유 (필수)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="반려 사유" />
          <div className="row gap">
            <button className="btn danger" disabled={busy || !reason.trim()} onClick={() => change("반려", reason)}>
              반려 확정
            </button>
            <button className="btn link" onClick={() => setRejecting(false)}>
              취소
            </button>
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </li>
  );
}
