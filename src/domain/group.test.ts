import { groupOfGrade, findGroupOverlaps, effectiveGroupId, DEFAULT_GROUPS, type Group } from "./group";

it("기본 그룹에서 학년 7은 중등", () => {
  expect(groupOfGrade(7, DEFAULT_GROUPS)?.name).toBe("중등");
});

it("어느 그룹에도 없는 학년은 null", () => {
  const groups: Group[] = [{ id: "e", name: "초등", gradeMin: 1, gradeMax: 5 }];
  expect(groupOfGrade(6, groups)).toBe(null);
});

it("학년 범위가 겹치는 그룹 쌍을 찾는다", () => {
  const groups: Group[] = [
    { id: "m", name: "중등", gradeMin: 7, gradeMax: 10 },
    { id: "h", name: "고등", gradeMin: 10, gradeMax: 12 },
  ];
  expect(findGroupOverlaps(groups)).toEqual([["m", "h"]]);
  expect(findGroupOverlaps(DEFAULT_GROUPS)).toEqual([]);
});

it("학생 그룹: 수동 지정이 자동 규칙보다 우선", () => {
  const today = new Date("2026-06-01");
  expect(effectiveGroupId("2013-03-01", null, DEFAULT_GROUPS, today)).toBe("middle"); // 2026-2013-6 = 7 → 중1
  expect(effectiveGroupId("2013-03-01", "high", DEFAULT_GROUPS, today)).toBe("high");
  expect(effectiveGroupId("2024-01-01", null, DEFAULT_GROUPS, today)).toBe(null); // 미취학
});
