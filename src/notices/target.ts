import type { Notice, NoticeTarget, Role } from "../data/types";

/** 공지를 보는 사람: groupIds는 자녀·본인의 생년(또는 수동 지정)으로 계산한 그룹 */
export type Viewer = { role: Role; studentIds: string[]; classIds: string[]; groupIds: string[] };

export function visibleTo(notice: Notice, v: Viewer): boolean {
  if (v.role === "admin") return true;
  const t: NoticeTarget = notice.target;
  switch (t.kind) {
    case "all":
      return true;
    case "group":
      return v.groupIds.includes(t.groupId);
    case "class":
      return v.classIds.includes(t.classId);
    case "student":
      return v.studentIds.includes(t.studentId);
  }
}

export function targetLabel(
  t: NoticeTarget,
  names: { groups: Map<string, string>; classes: Map<string, string>; students: Map<string, string> },
): string {
  switch (t.kind) {
    case "all":
      return "전체";
    case "group":
      return names.groups.get(t.groupId) ?? "그룹";
    case "class":
      return names.classes.get(t.classId) ?? "반";
    case "student":
      return names.students.get(t.studentId) ?? "학생";
  }
}

/** 상단 고정 먼저, 그다음 최신순 */
export function sortNotices(xs: Notice[]): Notice[] {
  return [...xs].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.getTime() - a.createdAt.getTime());
}

/** 글 삭제: 관리자는 모든 글, 그 밖에는 자기가 쓴 자유 의견·비밀글만 (공지는 관리자만). 보안 규칙과 같다. */
export function canDeletePost(post: Notice, role: Role, uid: string): boolean {
  if (role === "admin") return true;
  return post.board === "자유" && post.authorUid === uid;
}
