import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { canSeeAllClasses } from "../auth/roles";
import { repo, ACADEMY_ID } from "../data";
import { addDays, weekStartOf } from "../domain/week";
import { dayLabel } from "../lib/format";
import { useLoad } from "../lib/useLoad";
import { filterSessions, type SessionFilter } from "./filter";
import { SessionDetail } from "./SessionDetail";
import { WeekView } from "./WeekView";
import { RequestForm } from "../requests/RequestForm";

export function SchedulePage() {
  const { profile } = useAuth();
  const role = profile!.role;
  const seeAll = canSeeAllClasses(role);
  const [weekStart, setWeekStart] = useState(() => weekStartOf(new Date()));
  const [filter, setFilter] = useState<SessionFilter>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const meta = useLoad(
    async () => {
      const [classes, groups] = await Promise.all([repo.listClasses(ACADEMY_ID), repo.listGroups(ACADEMY_ID)]);
      return { classes, groups };
    },
    [],
  );
  const sessions = useLoad(
    () => repo.listSessionsForWeek(ACADEMY_ID, weekStart, seeAll ? undefined : profile!.classIds),
    [weekStart, seeAll, profile],
  );

  const classes = meta.data?.classes ?? [];
  const groups = meta.data?.groups ?? [];
  const visibleClasses = seeAll ? classes : classes.filter((c) => profile!.classIds.includes(c.id));
  const teachers = [...new Map(visibleClasses.map((c) => [c.teacherId, c.teacherName])).entries()];
  const shown = filterSessions(sessions.data ?? [], classes, filter);
  const selected = sessions.data?.find((s) => s.id === selectedId);

  return (
    <div className="page">
      <div className="week-nav">
        <button className="btn" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="이전 주">
          ‹
        </button>
        <strong>
          {dayLabel(weekStart)} – {dayLabel(addDays(weekStart, 6))}
        </strong>
        <button className="btn" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="다음 주">
          ›
        </button>
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

      {(sessions.error || meta.error) && <p className="error">{sessions.error || meta.error}</p>}
      {sessions.loading ? (
        <p className="muted">불러오는 중…</p>
      ) : (
        <WeekView weekStart={weekStart} sessions={shown} classes={classes} onSelect={setSelectedId} />
      )}

      {selected && (
        <SessionDetail
          session={selected}
          cls={classes.find((c) => c.id === selected.classId)}
          groups={groups}
          onClose={() => setSelectedId(null)}
        >
          <RequestForm session={selected} onDone={() => setSelectedId(null)} />
        </SessionDetail>
      )}
    </div>
  );
}
