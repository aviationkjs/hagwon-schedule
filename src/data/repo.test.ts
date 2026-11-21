// @vitest-environment node
// 에뮬레이터 필요: npm run test:emu
import type { Firestore } from "firebase/firestore";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { afterAll, beforeEach } from "vitest";
import { testEnv } from "../test/emulator";
import { makeRepo } from "./repo";

const A = "test-academy";

/** 보안 규칙을 켠 채로, 실제 앱처럼 로그인한 사용자로 저장소를 쓴다. */
async function dbAs(uid: string): Promise<Firestore> {
  return (await testEnv()).authenticatedContext(uid).firestore() as unknown as Firestore;
}
const adminDb = () => dbAs("admin1");

beforeEach(async () => {
  const env = await testEnv();
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, "users", "admin1"), {
      academyId: A, role: "admin", name: "원장", phone: "01000000001", studentIds: [], classIds: [],
    });
  });
});
afterAll(async () => (await testEnv()).cleanup());

it("createGroup 후 listGroups에 나온다", async () => {
  const repo = makeRepo(await adminDb());
  const id = await repo.createGroup(A, { name: "중등", gradeMin: 7, gradeMax: 9 });
  expect(await repo.listGroups(A)).toEqual([{ id, name: "중등", gradeMin: 7, gradeMax: 9 }]);
});

it("수동 그룹 지정은 사유가 없으면 거부된다", async () => {
  const repo = makeRepo(await adminDb());
  await expect(repo.setStudentGroupOverride(A, "s1", "high", " ")).rejects.toThrow();
});

async function seedRequest(db: Firestore) {
  await setDoc(doc(db, "academies", A, "sessions", "sess1"), {
    classId: "c1",
    teacherId: "t1",
    room: "1실",
    startAt: Timestamp.fromDate(new Date(2026, 10, 23, 14)),
    endAt: Timestamp.fromDate(new Date(2026, 10, 23, 15)),
    status: "예정",
  });
  const repo = makeRepo(db);
  return repo.createRequest(A, {
    sessionId: "sess1",
    classId: "c1",
    requesterUid: "admin1",
    requesterName: "학부모",
    reason: "병원 예약",
    desiredStart: new Date(2026, 10, 24, 16),
    desiredEnd: new Date(2026, 10, 24, 17),
  });
}

it("접수 → 반영 건너뛰기는 거부된다", async () => {
  const db = await adminDb();
  const id = await seedRequest(db);
  await expect(makeRepo(db).changeRequestStatus(A, id, "반영", "admin1")).rejects.toThrow();
});

it("동시에 두 번 반영해도 한 번만 적용되고 이력은 하나", async () => {
  const db = await adminDb();
  const repo = makeRepo(db);
  const id = await seedRequest(db);
  await repo.changeRequestStatus(A, id, "검토 중", "admin1");
  const results = await Promise.allSettled([
    repo.changeRequestStatus(A, id, "반영", "admin1"),
    repo.changeRequestStatus(A, id, "반영", "admin2"),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const log = await repo.listAuditLog(A);
  expect(log.filter((l) => String(l.action).endsWith("→ 반영"))).toHaveLength(1);
  const sess = await getDoc(doc(db, "academies", A, "sessions", "sess1"));
  expect(sess.data()?.status).toBe("변경됨");
  expect((sess.data()?.startAt as Timestamp).toDate()).toEqual(new Date(2026, 10, 24, 16));
});

it("전화번호 초대는 한 번만 연결된다", async () => {
  const repo = makeRepo(await adminDb());
  await repo.saveInvite(A, { phone: "01012345678", role: "parent", name: "김학부모", studentIds: ["s1"], classIds: ["c1"] });
  const p = await makeRepo(await dbAs("u1")).claimInvite(A, "u1", "01012345678");
  expect(p.role).toBe("parent");
  await expect(makeRepo(await dbAs("u2")).claimInvite(A, "u2", "01012345678")).rejects.toThrow("이미");
});
