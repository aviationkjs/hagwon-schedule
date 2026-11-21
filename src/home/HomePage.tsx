import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { canManageSchedule, canSeeAllClasses } from "../auth/roles";
import { repo, ACADEMY_ID, ROLE_LABEL } from "../data";
import { isOverdue } from "../domain/request";
import { addDays } from "../domain/week";
import { hhmm, sameDay } from "../lib/format";
import { useLoad } from "../lib/useLoad";
import { sortNotices, visibleTo } from "../notices/target";
import { useViewer } from "../notices/useViewer";

/** 최신 공지 3건 · 오늘 수업 · 내 요청(관리자: 처리할 요청) */
export function HomePage() {
  const { profile } = useAuth();
  const p = profile!;
  const isAdmin = canManageSchedule(p.role);
  const viewer = useViewer();

  const data = useLoad(async () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const [notices, sessions, requests] = await Promise.all([
      repo.listNotices(ACADEMY_ID),
      // listSessionsForWeek는 시작일부터 7일을 가져오므로 오늘 것만 거른다.
      repo.listSessionsForWeek(ACADEMY_ID, start, canSeeAllClasses(p.role) ? undefined : p.classIds),
      repo.listRequests(ACADEMY_ID, isAdmin ? {} : { requesterUid: p.uid }),
    ]);
    return {
      notices,
      todaySessions: sessions.filter((s) => sameDay(s.startAt, today) && s.startAt < addDays(start, 1)),
      requests,
    };
  }, [p]);

  const ctx = viewer.data;
  const classes = new Map((ctx?.classes ?? []).map((c) => [c.id, c.name]));
  const notices = ctx ? sortNotices((data.data?.notices ?? []).filter((n) => n.board === "공지" && visibleTo(n, ctx.viewer))).slice(0, 3) : [];
  const requests = data.data?.requests ?? [];
  const now = new Date();
  const pending = requests.filter((r) => r.status === "접수" || r.status === "검토 중");
  const overdue = pending.filter((r) => isOverdue(r, now));

  return (
    <div className="page">
      <h2>
        안녕하세요, {p.name}님 <span className="muted small">{ROLE_LABEL[p.role]}</span>
      </h2>
      {data.error && <p className="error">{data.error}</p>}

      <section className="card">
        <div className="row">
          <h3>공지</h3>
          <Link to="/board" className="small">
            전체 보기
          </Link>
        </div>
        {notices.length === 0 ? (
          <p className="muted small">새 공지가 없습니다.</p>
        ) : (
          <ul className="plain">
            {notices.map((n) => (
              <li key={n.id}>
                {n.pinned && <span className="badge">고정</span>} {n.title}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="row">
          <h3>오늘 수업</h3>
          <Link to="/schedule" className="small">
            주간 보기
          </Link>
        </div>
        {(data.data?.todaySessions ?? []).length === 0 ? (
          <p className="muted small">오늘은 수업이 없습니다.</p>
        ) : (
          <ul className="plain">
            {data.data!.todaySessions.map((s) => (
              <li key={s.id}>
                {hhmm(s.startAt)}–{hhmm(s.endAt)} {classes.get(s.classId) ?? ""} · {s.room}
                {s.status !== "예정" && <span className="badge">{s.status}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="row">
          <h3>{isAdmin ? "처리할 요청" : "내 요청"}</h3>
          <Link to="/requests" className="small">
            요청 보기
          </Link>
        </div>
        {isAdmin ? (
          <p>
            미처리 {pending.length}건
            {overdue.length > 0 && <span className="badge warn">7일 초과 {overdue.length}건</span>}
          </p>
        ) : requests.length === 0 ? (
          <p className="muted small">보낸 요청이 없습니다.</p>
        ) : (
          <ul className="plain">
            {requests.slice(0, 3).map((r) => (
              <li key={r.id}>
                {r.reason} <span className={`status s-${r.status.replace(" ", "")}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
