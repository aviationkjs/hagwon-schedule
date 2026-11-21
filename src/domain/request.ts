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
