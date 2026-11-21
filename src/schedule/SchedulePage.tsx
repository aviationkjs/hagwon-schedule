import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { canManageSchedule, canSeeAllClasses } from "../auth/roles";
import { repo, ACADEMY_ID } from "../data";
import { hhmm } from "../lib/format";
import { useLoad } from "../lib/useLoad";
import { RequestForm } from "../requests/RequestForm";
import { AddSessionSheet } from "./AddSessionSheet";
import { CalendarView } from "./CalendarView";
import { classHue, HUE_LABEL, toEvents } from "./calendar";
import { filterSessions, type SessionFilter } from "./filter";
import { SessionDetail } from "./SessionDetail";

export function SchedulePage() {
  const { profile } = useAuth();
  const role = profile!.role;
  const seeAll = canSeeAllClasses(role);
  const isAdmin = canManageSchedule(role);

  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);
  const [filter, setFilter] = useState<SessionFilter>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ start: Date; end: Date } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const meta = useLoad(async () => {
    const [classes, groups] = await Promise.all([repo.listClasses(ACADEMY_ID), repo.listGroups(ACADEMY_ID)]);
    return { classes, groups };
  }, []);

  // 캘린더가 보여 주는 기간만 읽는다 (월 보기면 한 달 치).
  const sessions = useLoad(
    async () =>
      range ? repo.listSessionsInRange(ACADEMY_ID, range.start, range.end, seeAll ? undefined : profile!.classIds) : [],
    [range, seeAll, profile],
  );

  const onRangeChange = useCallback((start: Date, end: Date) => {
    setRange((r) => (r && r.start.getTime() === start.getTime() && r.end.getTime() === end.getTime() ? r : { start, end }));
  }, []);

  const classes = meta.data?.classes ?? [];
  const groups = meta.data?.groups ?? [];
  const visibleClasses = seeAll ? classes : classes.filter((c) => profile!.classIds.includes(c.id));
  const teachers = [...new Map(visibleClasses.map((c) => [c.teacherId, c.teacherName])).entries()];
  const shown = filterSessions(sessions.data ?? [], classes, filter);
  const events = useMemo(() => toEvents(shown, classes), [shown, classes]);
  const selected = sessions.data?.find((s) => s.id === selectedId);

  function startAdding() {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    setAdding({ start, end: new Date(start.getTime() + 90 * 60 * 1000) });
  }

  /** 반·그룹·수업을 서버에서 다시 읽는다 (다른 사람이 바꾼 일정 반영). */
  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([meta.reload(), sessions.reload()]);
      setUpdatedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="page">
      <div className="row">
        <h2>스케줄</h2>
        <div className="row gap">
          <button
            className={`btn icon ${refreshing ? "spinning" : ""}`}
            onClick={refresh}
            disabled={refreshing}
            aria-label="새로고침"
            title={updatedAt ? `새로고침 (마지막 갱신 ${hhmm(updatedAt)})` : "새로고침"}
          >
            <RefreshIcon />
          </button>
          {isAdmin && (
            <button className="btn primary" onClick={startAdding}>
              + 수업
            </button>
          )}
        </div>
      </div>
      {updatedAt && <p className="muted small">마지막 갱신 {hhmm(updatedAt)}</p>}

      <div className="filters">
        <select aria-label="그룹" value={filter.groupId ?? ""} onChange={(e) => setFilter({ ...filter, groupId: e.target.value || undefined })}>
          <option value="">전체 그룹</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select aria-label="반" value={filter.classId ?? ""} onChange={(e) => setFilter({ ...filter, classId: e.target.value || undefined })}>
          <option value="">전체 반</option>
          {visibleClasses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {seeAll && (
          <select aria-label="강사" value={filter.teacherId ?? ""} onChange={(e) => setFilter({ ...filter, teacherId: e.target.value || undefined })}>
            <option value="">전체 강사</option>
            {teachers.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {visibleClasses.length > 0 && (
        <ul className="legend" aria-label="반 색">
          {visibleClasses.map((c) => (
            <li key={c.id} className={`hue-${classHue(c)}`} title={HUE_LABEL[classHue(c)]}>
              {c.name}
            </li>
          ))}
        </ul>
      )}

      {(sessions.error || meta.error) && <p className="error">{sessions.error || meta.error}</p>}
      {isAdmin && classes.length > 0 && (
        <p className="muted small">빈 시간을 누르거나 끌면 그 시간에 수업을 넣을 수 있습니다. (휴대폰은 길게 누르기)</p>
      )}

      <CalendarView
        events={events}
        onRangeChange={onRangeChange}
        onSelectEvent={setSelectedId}
        onCreate={isAdmin ? (start, end) => setAdding({ start, end }) : undefined}
      />

      {selected && (
        <SessionDetail
          session={selected}
          cls={classes.find((c) => c.id === selected.classId)}
          groups={groups}
          onClose={() => setSelectedId(null)}
          onDelete={
            isAdmin
              ? async () => {
                  await repo.deleteSession(ACADEMY_ID, selected.id);
                  setSelectedId(null);
                  await sessions.reload();
                }
              : undefined
          }
        >
          {!isAdmin && <RequestForm session={selected} onDone={() => setSelectedId(null)} />}
        </SessionDetail>
      )}

      {adding && (
        <AddSessionSheet
          classes={classes}
          start={adding.start}
          end={adding.end}
          onClose={() => setAdding(null)}
          onSaved={async () => {
            setAdding(null);
            await sessions.reload();
          }}
        />
      )}
    </div>
  );
}

/** Lucide refresh-cw (Astryx 아이콘 세트, ISC 라이선스) */
function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}
