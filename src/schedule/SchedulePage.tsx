import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { canManageSchedule, canSeeAllClasses } from "../auth/roles";
import { repo, ACADEMY_ID } from "../data";
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

  return (
    <div className="page">
      <div className="row">
        <h2>스케줄</h2>
        {isAdmin && (
          <button className="btn primary" onClick={startAdding}>
            + 수업
          </button>
        )}
      </div>

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
