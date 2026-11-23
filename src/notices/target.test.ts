import { canDeletePost, sortNotices, visibleTo, type Viewer } from "./target";
import type { Notice } from "../data/types";

const n = (target: Notice["target"]): Notice => ({
  id: "n", board: "공지", authorUid: "a", authorName: "원장", title: "t", body: "b", target, pinned: false, createdAt: new Date(),
});

const parentOfGrade5: Viewer = { role: "parent", studentIds: ["s1"], classIds: ["c1"], groupIds: ["elementary"] };
const middleStudentParent: Viewer = { role: "parent", studentIds: ["s2"], classIds: ["c2"], groupIds: ["middle"] };
const admin: Viewer = { role: "admin", studentIds: [], classIds: [], groupIds: [] };

it("전체 공지는 모두에게 보인다", () => {
  expect(visibleTo(n({ kind: "all" }), parentOfGrade5)).toBe(true);
  expect(visibleTo(n({ kind: "all" }), middleStudentParent)).toBe(true);
});

it("초등 그룹 공지는 초등 학부모에게만 보인다", () => {
  expect(visibleTo(n({ kind: "group", groupId: "elementary" }), parentOfGrade5)).toBe(true);
  expect(visibleTo(n({ kind: "group", groupId: "elementary" }), middleStudentParent)).toBe(false);
});

it("반 공지는 그 반 사람에게만", () => {
  expect(visibleTo(n({ kind: "class", classId: "c2" }), middleStudentParent)).toBe(true);
  expect(visibleTo(n({ kind: "class", classId: "c2" }), parentOfGrade5)).toBe(false);
});

it("특정 학생 공지는 대상이 아닌 학부모에게 안 보인다", () => {
  expect(visibleTo(n({ kind: "student", studentId: "s1" }), parentOfGrade5)).toBe(true);
  expect(visibleTo(n({ kind: "student", studentId: "s1" }), middleStudentParent)).toBe(false);
});

it("관리자는 모든 공지를 본다", () => {
  expect(visibleTo(n({ kind: "student", studentId: "s9" }), admin)).toBe(true);
});

it("상단 고정이 먼저, 그다음 최신순", () => {
  const mk = (id: string, pinned: boolean, day: number): Notice => ({ ...n({ kind: "all" }), id, pinned, createdAt: new Date(2026, 10, day) });
  expect(sortNotices([mk("old", false, 1), mk("pin", true, 2), mk("new", false, 3)]).map((x) => x.id)).toEqual(["pin", "new", "old"]);
});

describe("글 삭제 권한", () => {
  const post = (board: Notice["board"], authorUid: string, priv = false): Notice => ({ ...n({ kind: "all" }), board, authorUid, private: priv });
  it("관리자는 모든 글", () => {
    expect(canDeletePost(post("공지", "x"), "admin", "a1")).toBe(true);
    expect(canDeletePost(post("자유", "p1", true), "admin", "a1")).toBe(true);
  });
  it("쓴 사람은 자기 자유 의견·비밀글", () => {
    expect(canDeletePost(post("자유", "p1", true), "parent", "p1")).toBe(true);
    expect(canDeletePost(post("자유", "t1"), "teacher", "t1")).toBe(true);
  });
  it("남의 글과 공지는 못 지운다", () => {
    expect(canDeletePost(post("자유", "p1", true), "parent", "p2")).toBe(false);
    expect(canDeletePost(post("자유", "p1", true), "teacher", "t1")).toBe(false);
    expect(canDeletePost(post("공지", "t1"), "teacher", "t1")).toBe(false);
  });
});

it("비밀글이 섞여도 최신순, 고정 글이 먼저", () => {
  const mk = (id: string, day: number, extra: Partial<Notice> = {}): Notice => ({ ...n({ kind: "all" }), id, createdAt: new Date(2026, 10, day), ...extra });
  expect(sortNotices([mk("a", 1), mk("p", 3, { private: true }), mk("pin", 2, { pinned: true })]).map((x) => x.id)).toEqual(["pin", "p", "a"]);
});
