export type RequestStatus = "접수" | "검토 중" | "반영" | "반려";

export const REQUEST_STATUSES: RequestStatus[] = ["접수", "검토 중", "반영", "반려"];

// 반영·반려는 종료 상태라 나가는 전이가 없다.
const ALLOWED: Record<RequestStatus, RequestStatus[]> = {
  접수: ["검토 중", "반려"],
  "검토 중": ["반영", "반려"],
  반영: [],
  반려: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function transition(
  from: RequestStatus,
  to: RequestStatus,
  reason?: string,
): { ok: true } | { ok: false; error: string } {
  if (!canTransition(from, to)) {
    return { ok: false, error: `'${from}' 상태에서 '${to}'(으)로 바꿀 수 없습니다.` };
  }
  if (to === "반려" && !reason?.trim()) {
    return { ok: false, error: "반려 사유를 입력해야 합니다." };
  }
  return { ok: true };
}

/** 기획서 3.2: 접수 후 7일 안에 답장. Cloud Functions 없이 화면에서 배지로 알린다. */
export const RESPONSE_DAYS = 7;

export function isOverdue(req: { status: RequestStatus; createdAt: Date }, now: Date): boolean {
  if (req.status === "반영" || req.status === "반려") return false;
  return now.getTime() - req.createdAt.getTime() > RESPONSE_DAYS * 24 * 60 * 60 * 1000;
}
