import { filterSessions } from "./filter";
import type { ClassInfo, Session } from "../data/types";

const classes: ClassInfo[] = [
  { id: "c1", name: "중등 수학", teacherId: "t1", teacherName: "김강사", room: "1실", groupIds: ["middle"] },
  { id: "c2", name: "고등 영어", teacherId: "t2", teacherName: "이강사", room: "2실", groupIds: ["high"] },
  { id: "c3", name: "중고 혼합", teacherId: "t1", teacherName: "김강사", room: "3실", groupIds: ["middle", "high"] },
];
const s = (id: string, classId: string, teacherId: string): Session => ({
  id, classId, teacherId, room: "", startAt: new Date(2026, 10, 23, 14), endAt: new Date(2026, 10, 23, 15), status: "예정",
});
const sessions = [s("a", "c1", "t1"), s("b", "c2", "t2"), s("c", "c3", "t1")];

it("그룹으로 거르면 그 그룹이 연결된 반의 수업만 남는다", () => {
  expect(filterSessions(sessions, classes, { groupId: "middle" }).map((x) => x.id)).toEqual(["a", "c"]);
});

it("반과 그룹을 같이 주면 둘 다 만족해야 한다", () => {
  expect(filterSessions(sessions, classes, { groupId: "high", classId: "c1" })).toEqual([]);
  expect(filterSessions(sessions, classes, { groupId: "high", classId: "c3" }).map((x) => x.id)).toEqual(["c"]);
});

it("강사로 거른다", () => {
  expect(filterSessions(sessions, classes, { teacherId: "t2" }).map((x) => x.id)).toEqual(["b"]);
});

it("조건이 없으면 전부", () => {
  expect(filterSessions(sessions, classes, {})).toHaveLength(3);
});
