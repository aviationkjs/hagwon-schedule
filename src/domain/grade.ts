export type Level = "초등" | "중등" | "고등";

/** 학년 기준일은 매년 1월 1일. 학년 = 올해 − 생년 − 6. 1~12 밖이면 null (미취학·졸업). */
export function gradeOf(birthDate: string, today: Date): number | null {
  const birthYear = Number(birthDate.slice(0, 4));
  if (!Number.isInteger(birthYear)) return null;
  const grade = today.getFullYear() - birthYear - 6;
  return grade >= 1 && grade <= 12 ? grade : null;
}

/** 학년 번호(1~12)를 학교급으로. 초1=1, 중1=7, 고1=10. */
export function levelOf(grade: number): Level {
  if (grade <= 6) return "초등";
  if (grade <= 9) return "중등";
  return "고등";
}

/** 화면 표시용: 7 → "중1" */
export function gradeLabel(grade: number): string {
  const level = levelOf(grade);
  const inLevel = level === "초등" ? grade : level === "중등" ? grade - 6 : grade - 9;
  return `${level[0]}${inLevel}`;
}
