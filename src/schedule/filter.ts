import type { ClassInfo, Session } from "../data/types";

export type SessionFilter = { groupId?: string; classId?: string; teacherId?: string };

export function filterSessions(sessions: Session[], classes: ClassInfo[], f: SessionFilter): Session[] {
  const byId = new Map(classes.map((c) => [c.id, c]));
  return sessions.filter((s) => {
    if (f.classId && s.classId !== f.classId) return false;
    if (f.teacherId && s.teacherId !== f.teacherId) return false;
    if (f.groupId && !byId.get(s.classId)?.groupIds.includes(f.groupId)) return false;
    return true;
  });
}
