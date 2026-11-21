import type { Role } from "../data/types";

export function canManageSchedule(role: Role): boolean {
  return role === "admin";
}

export function canRequestChange(_role: Role): boolean {
  return true;
}

/** 보안 규칙과 같다: 관리자·강사는 학원 전체 일정을 읽을 수 있다. */
export function canSeeAllClasses(role: Role): boolean {
  return role === "admin" || role === "teacher";
}
