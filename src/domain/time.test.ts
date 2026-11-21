import { endAfterStart, minEndTime } from "./time";

it("시작을 바꾸면 원래 수업 길이를 유지해 종료를 옮긴다", () => {
  expect(endAfterStart("16:00", "17:30", "18:00")).toBe("19:30");
  expect(endAfterStart("16:00", "17:30", "15:00")).toBe("16:30");
});

it("길이를 알 수 없으면(종료가 시작보다 빠름) 1시간 30분", () => {
  expect(endAfterStart("16:00", "15:00", "18:00")).toBe("19:30");
});

it("자정을 넘기지 않는다 (23:59까지)", () => {
  expect(endAfterStart("16:00", "17:30", "23:00")).toBe("23:59");
});

it("종료 최솟값은 시작 1분 뒤", () => {
  expect(minEndTime("16:00")).toBe("16:01");
  expect(minEndTime("23:59")).toBe("23:59");
});
