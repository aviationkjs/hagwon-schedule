import { classHue, HUES, toEvents } from "./calendar";
import type { ClassInfo, Session } from "../data/types";

const cls = (id: string, color?: ClassInfo["color"]): ClassInfo => ({
  id, name: `${id}반`, teacherId: "t1", teacherName: "김강사", room: "1실", groupIds: [], color,
});
const session = (id: string, classId: string, status: Session["status"] = "예정"): Session => ({
  id, classId, teacherId: "t1", room: "2실",
  startAt: new Date(2026, 10, 23, 14), endAt: new Date(2026, 10, 23, 15, 30), status,
});

it("반에 고른 색이 있으면 그 색", () => {
  expect(classHue(cls("c1", "teal"))).toBe("teal");
});

it("색이 없으면 반 id로 늘 같은 색을 고른다 (회색 제외)", () => {
  const a = classHue(cls("abc"));
  expect(classHue(cls("abc"))).toBe(a);
  expect(HUES).toContain(a);
  expect(a).not.toBe("gray");
});

it("수업을 캘린더 일정으로 바꾼다", () => {
  const [e] = toEvents([session("s1", "c1")], [cls("c1", "blue")]);
  expect(e).toMatchObject({
    id: "s1",
    title: "c1반",
    start: new Date(2026, 10, 23, 14),
    end: new Date(2026, 10, 23, 15, 30),
    classNames: ["hue-blue"],
    extendedProps: { room: "2실", teacherName: "김강사", status: "예정" },
  });
});

it("변경된 수업은 표시 클래스가 붙고, 반이 없으면 회색", () => {
  const [e] = toEvents([session("s2", "gone", "변경됨")], []);
  expect(e.title).toBe("알 수 없는 반");
  expect(e.classNames).toEqual(["hue-gray", "is-changed"]);
});
