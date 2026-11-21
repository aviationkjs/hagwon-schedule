const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** 11/23 (월) */
export const dayLabel = (d: Date) => `${d.getMonth() + 1}/${d.getDate()} (${DAYS[d.getDay()]})`;

/** 11/23 (월) 14:00 */
export const dateTimeLabel = (d: Date) => `${dayLabel(d)} ${hhmm(d)}`;

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** <input type="datetime-local"> 값 ↔ Date */
export const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${hhmm(d)}`;
