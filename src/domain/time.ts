// "HH:MM" 시간 문자열 계산 (수업 등록 폼용)

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const LAST = 23 * 60 + 59;
const DEFAULT_LENGTH = 90;

/**
 * 시작 시간을 바꿀 때 새 종료 시간: 원래 수업 길이를 그대로 유지한다.
 * 길이를 알 수 없으면 1시간 30분. 하루를 넘기지 않게 23:59에서 멈춘다.
 */
export function endAfterStart(prevStart: string, prevEnd: string, newStart: string): string {
  const length = toMin(prevEnd) > toMin(prevStart) ? toMin(prevEnd) - toMin(prevStart) : DEFAULT_LENGTH;
  return toHHMM(Math.min(toMin(newStart) + length, LAST));
}

/** 종료 시간 입력칸의 최솟값: 시작 1분 뒤 */
export function minEndTime(start: string): string {
  return toHHMM(Math.min(toMin(start) + 1, LAST));
}
