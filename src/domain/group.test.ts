import { groupOfGrade, findGroupOverlaps, DEFAULT_GROUPS, type Group } from "./group";

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
