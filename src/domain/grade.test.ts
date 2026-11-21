import { gradeOf, levelOf } from "./grade";

it("기준일(1/1) 직전·직후에 학년이 바뀐다", () => {
  expect(gradeOf("2016-05-10", new Date("2022-12-31"))).toBe(null); // 기준연도 2022 → 0 → 범위 밖
  expect(gradeOf("2016-05-10", new Date("2023-01-01"))).toBe(1); // 기준연도 2023 → 1
});

it("학년 범위 밖이면 null", () => {
  expect(gradeOf("2030-01-01", new Date("2031-04-01"))).toBe(null);
  expect(gradeOf("2000-01-01", new Date("2025-04-01"))).toBe(null); // 19 → 졸업
});

it("고3은 12, 초6은 6", () => {
  expect(gradeOf("2008-07-01", new Date("2026-06-01"))).toBe(12);
  expect(gradeOf("2014-07-01", new Date("2026-06-01"))).toBe(6);
});

it("학년을 학교급으로 나눈다", () => {
  expect(levelOf(6)).toBe("초등");
  expect(levelOf(7)).toBe("중등");
  expect(levelOf(10)).toBe("고등");
});
