import { useAuth } from "../auth/AuthProvider";
import { repo, ACADEMY_ID } from "../data";
import { dateTimeLabel, hhmm } from "../lib/format";
import { useLoad } from "../lib/useLoad";

/** 강사·학부모·학생: 내가 보낸 요청과 처리 상태 */
export function RequestList() {
  const { profile } = useAuth();
  const { data, error, loading } = useLoad(
    () => repo.listRequests(ACADEMY_ID, { requesterUid: profile!.uid }),
    [profile],
  );

  if (loading) return <p className="muted">불러오는 중…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data?.length) return <p className="muted">보낸 변경 요청이 없습니다. 스케줄에서 수업을 눌러 요청할 수 있습니다.</p>;

  return (
    <ul className="list">
      {data.map((r) => (
        <li key={r.id} className="card">
          <div className="row">
            <strong>
              {dateTimeLabel(r.desiredStart)}–{hhmm(r.desiredEnd)}
            </strong>
            <span className={`status s-${r.status.replace(" ", "")}`}>{r.status}</span>
          </div>
          <p>{r.reason}</p>
          {r.status === "반려" && <p className="muted small">반려 사유: {r.handleReason}</p>}
        </li>
      ))}
    </ul>
  );
}
