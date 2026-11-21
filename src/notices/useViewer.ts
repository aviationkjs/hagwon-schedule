import { useAuth } from "../auth/AuthProvider";
import { repo, ACADEMY_ID } from "../data";
import { effectiveGroupId } from "../domain/group";
import { useLoad } from "../lib/useLoad";
import type { Viewer } from "./target";

/**
 * 공지 대상 판단에 필요한 '나'의 정보.
 * 학부모·학생: 자녀·본인 학생의 그룹 / 강사: 담당 반의 그룹 / 관리자: 전체 학생 목록(대상 고르기용)
 */
export function useViewer() {
  const { profile } = useAuth();
  return useLoad(async () => {
    const p = profile!;
    const [groups, classes] = await Promise.all([repo.listGroups(ACADEMY_ID), repo.listClasses(ACADEMY_ID)]);
    const students =
      p.role === "admin"
        ? await repo.listStudents(ACADEMY_ID)
        : p.studentIds.length
          ? await repo.getStudents(ACADEMY_ID, p.studentIds)
          : [];
    const today = new Date();
    const groupIds =
      p.role === "teacher"
        ? classes.filter((c) => p.classIds.includes(c.id)).flatMap((c) => c.groupIds)
        : students
            .map((s) => effectiveGroupId(s.birthDate, s.overrideGroupId, groups, today))
            .filter((g): g is string => g !== null);
    const viewer: Viewer = {
      role: p.role,
      studentIds: p.studentIds,
      classIds: p.classIds,
      groupIds: [...new Set(groupIds)],
    };
    return { viewer, groups, classes, students };
  }, [profile]);
}
