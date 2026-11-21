import { weekStartOf, weeklyOccurrences, addDays } from "./week";

it("주 시작은 월요일 0시", () => {
  const s = weekStartOf(new Date(2026, 10, 21, 15, 0)); // 2026-11-21 토
  expect(s).toEqual(new Date(2026, 10, 16, 0, 0)); // 2026-11-16 월
  expect(weekStartOf(new Date(2026, 10, 22, 9, 0))).toEqual(new Date(2026, 10, 16)); // 일요일은 같은 주
  expect(weekStartOf(new Date(2026, 10, 16, 0, 0))).toEqual(new Date(2026, 10, 16));
});

it("요일·시간으로 주간 반복 수업을 만든다", () => {
  // 2026-11-18(수)부터 월요일(1) 14:00~15:30, 2주
  const occ = weeklyOccurrences(new Date(2026, 10, 18), 1, "14:00", "15:30", 2);
  expect(occ).toEqual([
    { startAt: new Date(2026, 10, 23, 14, 0), endAt: new Date(2026, 10, 23, 15, 30) },
    { startAt: new Date(2026, 10, 30, 14, 0), endAt: new Date(2026, 10, 30, 15, 30) },
  ]);
});

it("시작일이 그 요일이면 그날부터", () => {
  const occ = weeklyOccurrences(new Date(2026, 10, 23), 1, "09:00", "10:00", 1);
  expect(occ[0].startAt).toEqual(new Date(2026, 10, 23, 9, 0));
});

it("종료 시간이 시작보다 빠르면 오류", () => {
  expect(() => weeklyOccurrences(new Date(2026, 10, 23), 1, "15:00", "14:00", 1)).toThrow();
});

it("addDays", () => {
  expect(addDays(new Date(2026, 10, 30), 1)).toEqual(new Date(2026, 11, 1));
});
