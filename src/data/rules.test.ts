// @vitest-environment node
// 에뮬레이터 필요: npm run test:emu
import type { Firestore } from "firebase/firestore";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, Timestamp } from "firebase/firestore";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { afterAll, beforeEach } from "vitest";
import { testEnv } from "../test/emulator";

const A = "main";

const profiles = {
  admin1: { academyId: A, role: "admin", name: "원장", phone: "01000000001", studentIds: [], classIds: [] },
  teacher1: { academyId: A, role: "teacher", name: "강사", phone: "01000000002", studentIds: [], classIds: ["c1"] },
  parent1: { academyId: A, role: "parent", name: "학부모1", phone: "01000000003", studentIds: ["s1"], classIds: ["c1"] },
  parent2: { academyId: "other", role: "parent", name: "다른학원", phone: "01000000004", studentIds: [], classIds: [] },
  parent3: { academyId: A, role: "parent", name: "학부모3", phone: "01000000005", studentIds: [], classIds: [] },
};

async function as(uid: keyof typeof profiles | null): Promise<Firestore> {
  const env = await testEnv();
  const ctx = uid ? env.authenticatedContext(uid) : env.unauthenticatedContext();
  return ctx.firestore() as unknown as Firestore;
}

beforeEach(async () => {
  const env = await testEnv();
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    for (const [uid, p] of Object.entries(profiles)) await setDoc(doc(db, "users", uid), p);
    const t = Timestamp.fromDate(new Date(2026, 10, 23, 14));
    await setDoc(doc(db, "academies", A, "sessions", "sess1"), { classId: "c1", teacherId: "teacher1", room: "1실", startAt: t, endAt: t, status: "예정" });
    await setDoc(doc(db, "academies", A, "sessions", "sess2"), { classId: "c2", teacherId: "x", room: "2실", startAt: t, endAt: t, status: "예정" });
    await setDoc(doc(db, "academies", A, "notices", "n1"), { board: "공지", title: "공지", target: { kind: "all" } });
    await setDoc(doc(db, "academies", A, "requests", "r1"), { sessionId: "sess1", classId: "c1", requesterUid: "teacher1", status: "접수", handledBy: null });
    await setDoc(doc(db, "academies", A, "invites", "01099998888"), { phone: "01099998888", role: "parent", name: "새학부모", studentIds: ["s2"], classIds: ["c2"], claimedBy: null });
  });
});
afterAll(async () => (await testEnv()).cleanup());

const sess = (db: Firestore, id: string) => doc(db, "academies", A, "sessions", id);

it("비로그인 사용자는 일정을 읽을 수 없다", async () => {
  await assertFails(getDoc(sess(await as(null), "sess1")));
});

it("학부모는 자기 반 일정만 읽는다", async () => {
  const db = await as("parent1");
  await assertSucceeds(getDoc(sess(db, "sess1")));
  await assertFails(getDoc(sess(db, "sess2")));
  await assertSucceeds(getDocs(query(collection(db, "academies", A, "sessions"), where("classId", "in", ["c1"]))));
  await assertFails(getDocs(collection(db, "academies", A, "sessions")));
});

it("학부모는 일정을 쓸 수 없고 관리자는 쓸 수 있다", async () => {
  await assertFails(updateDoc(sess(await as("parent1"), "sess1"), { room: "3실" }));
  await assertSucceeds(updateDoc(sess(await as("admin1"), "sess1"), { room: "3실" }));
});

it("다른 학원 사용자는 공지를 읽을 수 없다", async () => {
  await assertFails(getDoc(doc(await as("parent2"), "academies", A, "notices", "n1")));
  await assertSucceeds(getDoc(doc(await as("parent1"), "academies", A, "notices", "n1")));
});

it("강사는 요청을 만들 수 있지만 반영할 수 없다", async () => {
  const db = await as("teacher1");
  await assertSucceeds(
    setDoc(doc(db, "academies", A, "requests", "r2"), {
      sessionId: "sess1", classId: "c1", requesterUid: "teacher1", requesterName: "강사", reason: "출장",
      status: "접수", handledBy: null, handleReason: "",
    }),
  );
  await assertFails(updateDoc(doc(db, "academies", A, "requests", "r1"), { status: "반영" }));
});

it("남의 이름으로 요청을 만들 수 없다", async () => {
  await assertFails(
    setDoc(doc(await as("parent1"), "academies", A, "requests", "r3"), {
      sessionId: "sess1", classId: "c1", requesterUid: "teacher1", status: "접수", handledBy: null,
    }),
  );
});

it("학부모는 모두가 보는 게시판 글(공지·자유)을 못 쓰고, 강사는 자유 의견을 쓸 수 있다", async () => {
  const base = { title: "t", body: "b", target: { kind: "all" }, pinned: false };
  const parent = await as("parent1");
  await assertFails(setDoc(doc(parent, "academies", A, "notices", "f1"), { ...base, authorUid: "parent1", authorName: "학부모1", board: "자유" }));
  await assertFails(setDoc(doc(parent, "academies", A, "notices", "f2"), { ...base, authorUid: "parent1", authorName: "학부모1", board: "공지" }));
  const teacher = await as("teacher1");
  await assertSucceeds(setDoc(doc(teacher, "academies", A, "notices", "f3"), { ...base, authorUid: "teacher1", authorName: "강사", board: "자유" }));
});

describe("학부모 비밀글 (운영진만 보기)", () => {
  const post = (uid: string) => ({ authorUid: uid, authorName: "x", title: "상담", body: "문의" });
  const pp = (db: Firestore, id: string) => doc(db, "academies", A, "private_posts", id);
  const seedPost = async () => {
    const env = await testEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(pp(ctx.firestore() as unknown as Firestore, "p1"), post("parent1"));
    });
  };

  it("학부모가 쓸 수 있고, 남의 이름으로는 못 쓴다", async () => {
    const db = await as("parent1");
    await assertSucceeds(setDoc(pp(db, "new"), post("parent1")));
    await assertFails(setDoc(pp(db, "fake"), post("parent3")));
  });

  it("쓴 사람·강사·관리자만 읽고, 다른 학부모는 못 읽는다", async () => {
    await seedPost();
    await assertSucceeds(getDoc(pp(await as("parent1"), "p1")));
    await assertSucceeds(getDoc(pp(await as("teacher1"), "p1")));
    await assertSucceeds(getDoc(pp(await as("admin1"), "p1")));
    await assertFails(getDoc(pp(await as("parent3"), "p1")));
    await assertFails(getDoc(pp(await as("parent2"), "p1"))); // 다른 학원
  });

  it("학부모는 자기 글만 목록으로 가져올 수 있다", async () => {
    await seedPost();
    const db = await as("parent3");
    const col = collection(db, "academies", A, "private_posts");
    await assertSucceeds(getDocs(query(col, where("authorUid", "==", "parent3"))));
    await assertFails(getDocs(col));
  });

  it("쓴 사람과 관리자만 지울 수 있다", async () => {
    await seedPost();
    await assertFails(deleteDoc(pp(await as("parent3"), "p1")));
    await assertFails(deleteDoc(pp(await as("teacher1"), "p1")));
    await assertSucceeds(deleteDoc(pp(await as("parent1"), "p1")));
    await seedPost();
    await assertSucceeds(deleteDoc(pp(await as("admin1"), "p1")));
  });
});

it("공지는 관리자만 지우고, 자유 의견은 쓴 사람도 지울 수 있다", async () => {
  const env = await testEnv();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, "academies", A, "notices", "free1"), { board: "자유", authorUid: "teacher1", title: "t", target: { kind: "all" } });
  });
  await assertFails(deleteDoc(doc(await as("teacher1"), "academies", A, "notices", "n1")));
  await assertSucceeds(deleteDoc(doc(await as("teacher1"), "academies", A, "notices", "free1")));
  await assertSucceeds(deleteDoc(doc(await as("admin1"), "academies", A, "notices", "n1")));
});

it("관리자는 요청을 반영할 수 있다", async () => {
  await assertSucceeds(updateDoc(doc(await as("admin1"), "academies", A, "requests", "r1"), { status: "검토 중", handledBy: "admin1" }));
});

it("전화번호 초대는 그대로만 연결할 수 있다", async () => {
  const env = await testEnv();
  const db = env.authenticatedContext("newbie").firestore() as unknown as Firestore;
  const inviteRef = doc(db, "academies", A, "invites", "01099998888");
  const good = { academyId: A, role: "parent", name: "새학부모", phone: "01099998888", studentIds: ["s2"], classIds: ["c2"] };
  // 역할을 바꿔서 연결하려 하면 거부
  const { writeBatch } = await import("firebase/firestore");
  const bad = writeBatch(db);
  bad.set(doc(db, "users", "newbie"), { ...good, role: "admin" });
  bad.update(inviteRef, { claimedBy: "newbie" });
  await assertFails(bad.commit());
  const ok = writeBatch(db);
  ok.set(doc(db, "users", "newbie"), good);
  ok.update(inviteRef, { claimedBy: "newbie" });
  await assertSucceeds(ok.commit());
});
