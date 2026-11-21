import type { Group } from "../domain/group";
import type { RequestStatus } from "../domain/request";

export type { Group, RequestStatus };

export type Role = "admin" | "teacher" | "parent" | "student";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "관리자",
  teacher: "강사",
  parent: "학부모",
  student: "학생",
};

/** users/{uid} — 로그인한 사람의 학원 내 프로필 */
export type UserProfile = {
  uid: string;
  academyId: string;
  role: Role;
  name: string;
  phone: string; // normalizePhone 결과
  studentIds: string[]; // 학부모: 자녀, 학생: 본인
  classIds: string[]; // 볼 수 있는 반 (강사: 담당 반)
};

/** academies/{a}/invites/{phone} — 관리자가 미리 등록, 첫 로그인 때 전화번호로 연결 */
export type Invite = {
  phone: string;
  role: Role;
  name: string;
  studentIds: string[];
  classIds: string[];
  claimedBy: string | null;
};

export type Student = {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD, 학년은 저장하지 않고 계산
  overrideGroupId: string | null;
  overrideReason: string;
  classIds: string[];
  photoConsent: boolean;
};

/** Astryx 분류용 색 이름 */
export type Hue = "red" | "orange" | "yellow" | "green" | "teal" | "cyan" | "blue" | "purple" | "pink" | "gray";

export type ClassInfo = {
  id: string;
  name: string;
  teacherId: string; // 강사 uid (초대가 연결된 계정)
  teacherName: string;
  room: string;
  groupIds: string[];
  color?: Hue; // 캘린더에서 이 반을 나타내는 색
};
export type ClassInput = Omit<ClassInfo, "id">;

export type SessionStatus = "예정" | "변경됨" | "취소";

export type Session = {
  id: string;
  classId: string;
  teacherId: string;
  room: string;
  startAt: Date;
  endAt: Date;
  status: SessionStatus;
};

export type ChangeRequest = {
  id: string;
  sessionId: string;
  classId: string;
  requesterUid: string;
  requesterName: string;
  reason: string;
  desiredStart: Date;
  desiredEnd: Date;
  status: RequestStatus;
  handledBy: string | null;
  handleReason: string;
  createdAt: Date;
};
export type ChangeRequestInput = Pick<
  ChangeRequest,
  "sessionId" | "classId" | "requesterUid" | "requesterName" | "reason" | "desiredStart" | "desiredEnd"
>;

export type NoticeTarget =
  | { kind: "all" }
  | { kind: "group"; groupId: string }
  | { kind: "class"; classId: string }
  | { kind: "student"; studentId: string };

export type Board = "공지" | "자유";

export type Notice = {
  id: string;
  board: Board;
  authorUid: string;
  authorName: string;
  title: string;
  body: string;
  target: NoticeTarget;
  pinned: boolean;
  createdAt: Date;
};
export type NoticeInput = Omit<Notice, "id" | "createdAt">;
