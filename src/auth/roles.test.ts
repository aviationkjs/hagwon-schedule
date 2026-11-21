import { canManageSchedule, canRequestChange, canSeeAllClasses } from "./roles";

it("일정 관리는 관리자만", () => {
  expect(canManageSchedule("admin")).toBe(true);
  expect(canManageSchedule("teacher")).toBe(false);
  expect(canManageSchedule("parent")).toBe(false);
  expect(canManageSchedule("student")).toBe(false);
});

it("변경 요청은 모두", () => {
  for (const r of ["admin", "teacher", "parent", "student"] as const) expect(canRequestChange(r)).toBe(true);
});

it("전체 반 보기는 관리자·강사", () => {
  expect(canSeeAllClasses("teacher")).toBe(true);
  expect(canSeeAllClasses("parent")).toBe(false);
});
