import { canTransition, isOverdue, transition } from "./request";

it("허용된 전이만 통과한다", () => {
  expect(canTransition("접수", "검토 중")).toBe(true);
  expect(canTransition("검토 중", "반영")).toBe(true);
  expect(canTransition("접수", "반려")).toBe(true);
  expect(canTransition("접수", "반영")).toBe(false); // 건너뛰기 거부
  expect(canTransition("반려", "반영")).toBe(false); // 반려 후 재처리 거부
  expect(canTransition("반영", "검토 중")).toBe(false); // 역행 거부
  expect(canTransition("반영", "반영")).toBe(false); // 중복 반영 거부
});

it("반려는 사유가 있어야 한다", () => {
  expect(transition("검토 중", "반려", "")).toEqual({ ok: false, error: expect.any(String) });
  expect(transition("검토 중", "반려", "   ")).toEqual({ ok: false, error: expect.any(String) });
  expect(transition("검토 중", "반려", "교실 중복")).toEqual({ ok: true });
});

it("허용되지 않은 전이는 이유와 함께 실패한다", () => {
  expect(transition("접수", "반영")).toEqual({ ok: false, error: expect.stringContaining("접수") });
});

it("처리 기한 7일이 지난 미처리 요청은 기한 초과", () => {
  const created = new Date(2026, 10, 1, 10);
  expect(isOverdue({ status: "접수", createdAt: created }, new Date(2026, 10, 8, 9))).toBe(false);
  expect(isOverdue({ status: "검토 중", createdAt: created }, new Date(2026, 10, 8, 11))).toBe(true);
  expect(isOverdue({ status: "반영", createdAt: created }, new Date(2026, 10, 30))).toBe(false);
});
