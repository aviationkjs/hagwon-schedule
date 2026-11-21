export type Group = { id: string; name: string; gradeMin: number; gradeMax: number };

/** 학년 번호 기준 기본 그룹: 초등 1~6, 중등 7~9, 고등 10~12 */
export const DEFAULT_GROUPS: Group[] = [
  { id: "elementary", name: "초등", gradeMin: 1, gradeMax: 6 },
  { id: "middle", name: "중등", gradeMin: 7, gradeMax: 9 },
  { id: "high", name: "고등", gradeMin: 10, gradeMax: 12 },
];

export function groupOfGrade(grade: number, groups: Group[]): Group | null {
  return groups.find((g) => g.gradeMin <= grade && grade <= g.gradeMax) ?? null;
}

/** 학년 범위가 겹치는 그룹 쌍의 id 목록 */
export function findGroupOverlaps(groups: Group[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const a = groups[i];
      const b = groups[j];
      if (a.gradeMin <= b.gradeMax && b.gradeMin <= a.gradeMax) pairs.push([a.id, b.id]);
    }
  }
  return pairs;
}
