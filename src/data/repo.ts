import {
  type Firestore,
  type DocumentData,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { transition, type RequestStatus } from "../domain/request";
import { addDays, weeklyOccurrences } from "../domain/week";
import type {
  ChangeRequest,
  ChangeRequestInput,
  ClassInfo,
  ClassInput,
  Group,
  Invite,
  Notice,
  NoticeInput,
  Session,
  Student,
  UserProfile,
} from "./types";

const toDate = (v: unknown): Date => (v instanceof Timestamp ? v.toDate() : (v as Date));

/** Firestore 'in' 쿼리 한 번에 넣을 수 있는 최대 값 수 */
const IN_LIMIT = 30;

function chunks<T>(xs: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}

/** 저장소 함수 묶음. 테스트에서는 에뮬레이터 Firestore를 넣는다. */
export function makeRepo(db: Firestore) {
  const col = (a: string, name: string) => collection(db, "academies", a, name);
  const ref = (a: string, name: string, id: string) => doc(db, "academies", a, name, id);

  const withId = <T>(id: string, data: DocumentData) => ({ id, ...data }) as T;

  const toSession = (id: string, d: DocumentData): Session => ({
    ...(d as Omit<Session, "id" | "startAt" | "endAt">),
    id,
    startAt: toDate(d.startAt),
    endAt: toDate(d.endAt),
  });

  const toRequest = (id: string, d: DocumentData): ChangeRequest => ({
    ...(d as ChangeRequest),
    id,
    desiredStart: toDate(d.desiredStart),
    desiredEnd: toDate(d.desiredEnd),
    createdAt: d.createdAt ? toDate(d.createdAt) : new Date(),
  });

  return {
    // ── 사용자·초대 ─────────────────────────────
    async getProfile(uid: string): Promise<UserProfile | null> {
      const s = await getDoc(doc(db, "users", uid));
      return s.exists() ? ({ uid, ...s.data() } as UserProfile) : null;
    },

    /**
     * 구성원 등록·수정. 이미 연결된 계정이 있으면 그 계정의 프로필(역할·반·자녀)도 같이 바꾼다.
     */
    async saveInvite(a: string, invite: Omit<Invite, "claimedBy">): Promise<void> {
      const inviteRef = ref(a, "invites", invite.phone);
      const existing = await getDoc(inviteRef);
      const claimedBy = existing.exists() ? ((existing.data() as Invite).claimedBy ?? null) : null;
      const batch = writeBatch(db);
      batch.set(inviteRef, { ...invite, claimedBy });
      if (claimedBy) {
        batch.update(doc(db, "users", claimedBy), {
          role: invite.role,
          name: invite.name,
          studentIds: invite.studentIds,
          classIds: invite.classIds,
        });
      }
      await batch.commit();
    },

    async listInvites(a: string): Promise<Invite[]> {
      const s = await getDocs(col(a, "invites"));
      return s.docs.map((d) => d.data() as Invite);
    },

    /**
     * 구성원 삭제: 초대를 지우고, 이미 연결된 계정이 있으면 그 프로필도 지워 바로 접근을 막는다.
     * (Google 계정 자체는 남는다. 같은 번호로 다시 초대하면 다시 연결할 수 있다.)
     */
    async deleteMember(a: string, phone: string, actorUid: string): Promise<void> {
      const inviteRef = ref(a, "invites", phone);
      const s = await getDoc(inviteRef);
      if (!s.exists()) return;
      const claimedBy = (s.data() as Invite).claimedBy;
      if (claimedBy === actorUid) throw new Error("본인 계정은 지울 수 없습니다.");
      const batch = writeBatch(db);
      batch.delete(inviteRef);
      if (claimedBy) batch.delete(doc(db, "users", claimedBy));
      await batch.commit();
    },

    /** 첫 로그인: 전화번호로 초대를 찾아 프로필을 만든다. 이미 연결된 초대면 실패. */
    async claimInvite(a: string, uid: string, phone: string): Promise<UserProfile> {
      const inviteRef = ref(a, "invites", phone);
      return runTransaction(db, async (tx) => {
        const s = await tx.get(inviteRef);
        if (!s.exists()) throw new Error("등록된 전화번호가 없습니다. 학원에 문의하세요.");
        const inv = s.data() as Invite;
        if (inv.claimedBy) throw new Error("이미 다른 계정에 연결된 번호입니다.");
        const profile: UserProfile = {
          uid,
          academyId: a,
          role: inv.role,
          name: inv.name,
          phone,
          studentIds: inv.studentIds,
          classIds: inv.classIds,
        };
        const { uid: _ignored, ...data } = profile; // eslint-disable-line @typescript-eslint/no-unused-vars
        tx.set(doc(db, "users", uid), data);
        tx.update(inviteRef, { claimedBy: uid });
        return profile;
      });
    },

    // ── 그룹·반·학생 ────────────────────────────
    async createGroup(a: string, g: Omit<Group, "id">): Promise<string> {
      return (await addDoc(col(a, "groups"), g)).id;
    },

    /** 그룹 전체를 한 번에 저장한다 (편집 화면용). 목록에 없는 그룹은 지운다. */
    async saveGroups(a: string, groups: Group[]): Promise<void> {
      const existing = await getDocs(col(a, "groups"));
      const batch = writeBatch(db);
      const keep = new Set(groups.map((g) => g.id));
      existing.docs.filter((d) => !keep.has(d.id)).forEach((d) => batch.delete(d.ref));
      groups.forEach(({ id, ...g }) => batch.set(ref(a, "groups", id), g));
      await batch.commit();
    },

    async listGroups(a: string): Promise<Group[]> {
      const s = await getDocs(col(a, "groups"));
      // 학년 순(초등→중등→고등), 수동 지정 전용 그룹(학년 0)은 맨 뒤
      const order = (g: Group) => (g.gradeMin === 0 ? 99 : g.gradeMin);
      return s.docs.map((d) => withId<Group>(d.id, d.data())).sort((x, y) => order(x) - order(y));
    },

    async saveClass(a: string, c: ClassInput, id?: string): Promise<string> {
      if (id) {
        await setDoc(ref(a, "classes", id), c);
        return id;
      }
      return (await addDoc(col(a, "classes"), c)).id;
    },

    async listClasses(a: string): Promise<ClassInfo[]> {
      const s = await getDocs(col(a, "classes"));
      return s.docs.map((d) => withId<ClassInfo>(d.id, d.data()));
    },

    async saveStudent(a: string, st: Omit<Student, "id">, id?: string): Promise<string> {
      if (id) {
        await setDoc(ref(a, "students", id), st);
        return id;
      }
      return (await addDoc(col(a, "students"), st)).id;
    },

    async listStudents(a: string, ids?: string[]): Promise<Student[]> {
      const s = await getDocs(col(a, "students"));
      const all = s.docs.map((d) => withId<Student>(d.id, d.data()));
      return ids ? all.filter((x) => ids.includes(x.id)) : all;
    },

    /**
     * 학생 삭제: 학생을 지우고, 이 학생을 가진 학부모·학생 연결에서 빼며
     * 그 사람이 볼 수 있는 반을 남은 학생들의 반으로 다시 계산한다.
     */
    async deleteStudent(a: string, studentId: string): Promise<void> {
      const [students, invites] = await Promise.all([this.listStudents(a), this.listInvites(a)]);
      const remaining = students.filter((s) => s.id !== studentId);
      const batch = writeBatch(db);
      batch.delete(ref(a, "students", studentId));
      for (const inv of invites.filter((i) => i.studentIds.includes(studentId))) {
        const studentIds = inv.studentIds.filter((id) => id !== studentId);
        const classIds = [...new Set(remaining.filter((s) => studentIds.includes(s.id)).flatMap((s) => s.classIds))];
        batch.update(ref(a, "invites", inv.phone), { studentIds, classIds });
        if (inv.claimedBy) batch.update(doc(db, "users", inv.claimedBy), { studentIds, classIds });
      }
      await batch.commit();
    },

    async getStudents(a: string, ids: string[]): Promise<Student[]> {
      const snaps = await Promise.all(ids.map((id) => getDoc(ref(a, "students", id))));
      return snaps.filter((s) => s.exists()).map((s) => withId<Student>(s.id, s.data()!));
    },

    /** 학생의 그룹을 수동 지정한다. groupId가 있으면 사유가 필수. null이면 자동 규칙으로 되돌린다. */
    async setStudentGroupOverride(
      a: string,
      studentId: string,
      groupId: string | null,
      reason: string,
    ): Promise<void> {
      if (groupId && !reason.trim()) throw new Error("수동 지정 사유를 입력해야 합니다.");
      await updateDoc(ref(a, "students", studentId), {
        overrideGroupId: groupId,
        overrideReason: groupId ? reason.trim() : "",
      });
    },

    // ── 수업 일정 ───────────────────────────────
    async createWeeklySessions(
      a: string,
      cls: ClassInfo,
      opts: { weekday: number; start: string; end: string; from: Date; weeks: number },
    ): Promise<number> {
      const occ = weeklyOccurrences(opts.from, opts.weekday, opts.start, opts.end, opts.weeks);
      const batch = writeBatch(db);
      occ.forEach(({ startAt, endAt }) =>
        batch.set(doc(col(a, "sessions")), {
          classId: cls.id,
          teacherId: cls.teacherId,
          room: cls.room,
          startAt: Timestamp.fromDate(startAt),
          endAt: Timestamp.fromDate(endAt),
          status: "예정",
        }),
      );
      await batch.commit();
      return occ.length;
    },

    /** 한 주(시작일부터 7일)의 수업. */
    async listSessionsForWeek(a: string, weekStart: Date, classIds?: string[]): Promise<Session[]> {
      return this.listSessionsInRange(a, weekStart, addDays(weekStart, 7), classIds);
    },

    /** 관리자: 수업 하나를 지운다. 이 수업에 걸린 변경 요청은 남는다. */
    async deleteSession(a: string, sessionId: string): Promise<void> {
      await deleteDoc(ref(a, "sessions", sessionId));
    },

    /**
     * start 이상 end 미만에 시작하는 수업 (캘린더가 보여 주는 기간). classIds를 주면 그 반만 가져온다.
     * 보안 규칙은 필터가 아니므로 학부모·학생은 반드시 classIds를 넘겨야 한다.
     */
    async listSessionsInRange(a: string, start: Date, end: Date, classIds?: string[]): Promise<Session[]> {
      const range = [
        where("startAt", ">=", Timestamp.fromDate(start)),
        where("startAt", "<", Timestamp.fromDate(end)),
      ];
      if (classIds && classIds.length === 0) return [];
      const queries = classIds
        ? chunks(classIds, IN_LIMIT).map((ids) =>
            query(col(a, "sessions"), where("classId", "in", ids), ...range, orderBy("startAt")),
          )
        : [query(col(a, "sessions"), ...range, orderBy("startAt"))];
      const snaps = await Promise.all(queries.map((q) => getDocs(q)));
      return snaps
        .flatMap((s) => s.docs.map((d) => toSession(d.id, d.data())))
        .sort((x, y) => x.startAt.getTime() - y.startAt.getTime());
    },

    // ── 변경 요청 ───────────────────────────────
    async createRequest(a: string, input: ChangeRequestInput): Promise<string> {
      if (!input.reason.trim()) throw new Error("요청 사유를 입력해야 합니다.");
      const r = await addDoc(col(a, "requests"), {
        ...input,
        desiredStart: Timestamp.fromDate(input.desiredStart),
        desiredEnd: Timestamp.fromDate(input.desiredEnd),
        status: "접수",
        handledBy: null,
        handleReason: "",
        createdAt: serverTimestamp(),
      });
      return r.id;
    },

    /** requesterUid를 주면 본인 요청만 (학부모·학생·강사는 반드시 넘긴다). */
    async listRequests(
      a: string,
      opts: { status?: RequestStatus; requesterUid?: string } = {},
    ): Promise<ChangeRequest[]> {
      const filters = [
        ...(opts.requesterUid ? [where("requesterUid", "==", opts.requesterUid)] : []),
        ...(opts.status ? [where("status", "==", opts.status)] : []),
      ];
      const s = await getDocs(query(col(a, "requests"), ...filters, orderBy("createdAt", "desc")));
      return s.docs.map((d) => toRequest(d.id, d.data()));
    },

    /**
     * 요청 상태를 바꾼다. 트랜잭션 안에서 현재 상태를 다시 읽어 전이를 검사하므로
     * 관리자 두 명이 동시에 '반영'해도 한 번만 적용된다. '반영'이면 수업 시간도 바꾼다.
     */
    async changeRequestStatus(
      a: string,
      requestId: string,
      to: RequestStatus,
      actorUid: string,
      reason = "",
    ): Promise<void> {
      const reqRef = ref(a, "requests", requestId);
      await runTransaction(db, async (tx) => {
        const s = await tx.get(reqRef);
        if (!s.exists()) throw new Error("요청을 찾을 수 없습니다.");
        const req = toRequest(s.id, s.data());
        const result = transition(req.status, to, reason);
        if (!result.ok) throw new Error(result.error);

        const sessionRef = ref(a, "sessions", req.sessionId);
        const sessionSnap = to === "반영" ? await tx.get(sessionRef) : null;
        if (sessionSnap && !sessionSnap.exists()) throw new Error("대상 수업이 없습니다.");

        tx.update(reqRef, { status: to, handledBy: actorUid, handleReason: reason.trim() });
        if (sessionSnap) {
          tx.update(sessionRef, {
            startAt: Timestamp.fromDate(req.desiredStart),
            endAt: Timestamp.fromDate(req.desiredEnd),
            status: "변경됨",
          });
        }
        tx.set(doc(col(a, "audit_log")), {
          actorUid,
          target: `requests/${requestId}`,
          action: `요청 ${req.status} → ${to}`,
          before: { status: req.status },
          after: { status: to, reason: reason.trim() },
          at: serverTimestamp(),
        });
      });
    },

    // ── 공지·게시판 ─────────────────────────────
    async createNotice(a: string, n: NoticeInput): Promise<string> {
      return (await addDoc(col(a, "notices"), { ...n, createdAt: serverTimestamp() })).id;
    },

    async listNotices(a: string): Promise<Notice[]> {
      const s = await getDocs(query(col(a, "notices"), orderBy("createdAt", "desc")));
      return s.docs.map((d) => {
        const data = d.data();
        return { ...(data as Notice), id: d.id, createdAt: data.createdAt ? toDate(data.createdAt) : new Date() };
      });
    },

    async listAuditLog(a: string): Promise<DocumentData[]> {
      const s = await getDocs(query(col(a, "audit_log"), orderBy("at", "desc")));
      return s.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  };
}

export type Repo = ReturnType<typeof makeRepo>;
