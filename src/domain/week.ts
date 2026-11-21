export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

/** 그 주의 월요일 0시 (기기 시간대 기준). 일요일은 앞 주에 속한다. */
export function weekStartOf(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (r.getDay() + 6) % 7; // 월=0 … 일=6
  return addDays(r, -offset);
}

function atTime(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
}

/**
 * from 이후 처음 오는 weekday(0=일 … 6=토)부터 weeks 주 동안 매주 같은 시간 수업을 만든다.
 */
export function weeklyOccurrences(
  from: Date,
  weekday: number,
  start: string,
  end: string,
  weeks: number,
): Array<{ startAt: Date; endAt: Date }> {
  const first = addDays(
    new Date(from.getFullYear(), from.getMonth(), from.getDate()),
    (weekday - from.getDay() + 7) % 7,
  );
  if (atTime(first, end) <= atTime(first, start)) {
    throw new Error("종료 시간은 시작 시간보다 늦어야 합니다.");
  }
  return Array.from({ length: weeks }, (_, i) => {
    const day = addDays(first, i * 7);
    return { startAt: atTime(day, start), endAt: atTime(day, end) };
  });
}
