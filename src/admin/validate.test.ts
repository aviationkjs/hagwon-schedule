import { validateGroupsForSave } from "./validate";
import { DEFAULT_GROUPS, type Group } from "../domain/group";

const g = (id: string, name: string, gradeMin: number, gradeMax: number): Group => ({ id, name, gradeMin, gradeMax });

it("기본 그룹은 통과", () => {
  expect(validateGroupsForSave(DEFAULT_GROUPS)).toEqual({ ok: true, warnings: [] });
});

it("중등·고등 범위가 겹치면 실패", () => {
  const r = validateGroupsForSave([g("e", "초등", 1, 6), g("m", "중등", 7, 10), g("h", "고등", 10, 12)]);
  expect(r).toEqual({ ok: false, error: "중등·고등 학년 범위가 겹칩니다." });
});

it("초등·중등이 겹쳐도 실패", () => {
  expect(validateGroupsForSave([g("e", "초등", 1, 6), g("m", "중등", 6, 9)]).ok).toBe(false);
});

it("빈 학년은 경고만 하고 저장은 된다", () => {
  const r = validateGroupsForSave([g("e", "초등", 1, 5), g("m", "중등", 7, 9), g("h", "고등", 10, 12)]);
  expect(r).toEqual({ ok: true, warnings: ["초6이 어느 그룹에도 없습니다."] });
});

it("수동 전용 그룹(학년 0)은 겹침 검사에서 빠진다", () => {
  expect(validateGroupsForSave([...DEFAULT_GROUPS, g("s", "특목반", 0, 0)]).ok).toBe(true);
});

it("이름이 비었거나 범위가 거꾸로면 실패", () => {
  expect(validateGroupsForSave([g("e", " ", 1, 6)]).ok).toBe(false);
  expect(validateGroupsForSave([g("e", "초등", 6, 1)]).ok).toBe(false);
  expect(validateGroupsForSave([g("e", "초등", 1, 13)]).ok).toBe(false);
});

it("이름이 같은 그룹은 실패", () => {
  expect(validateGroupsForSave([g("a", "초등", 1, 3), g("b", "초등", 4, 6)]).ok).toBe(false);
});
