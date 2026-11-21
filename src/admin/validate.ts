import { isManualOnly, type Group } from "../domain/group";
import { gradeLabel } from "../domain/grade";

export type GroupValidation = { ok: true; warnings: string[] } | { ok: false; error: string };

/** 그룹 편성 저장 전 검사. 겹침·잘못된 범위는 막고, 어느 그룹에도 없는 학년은 경고만 한다. */
export function validateGroupsForSave(groups: Group[]): GroupValidation {
  const names = new Set<string>();
  for (const g of groups) {
    const name = g.name.trim();
    if (!name) return { ok: false, error: "그룹 이름을 입력해야 합니다." };
    if (names.has(name)) return { ok: false, error: `'${name}' 그룹이 두 개 있습니다.` };
    names.add(name);
    if (isManualOnly(g)) continue;
    if (g.gradeMin < 1 || g.gradeMax > 12 || g.gradeMin > g.gradeMax) {
      return { ok: false, error: `'${name}' 그룹의 학년 범위가 올바르지 않습니다.` };
    }
  }

  const auto = groups.filter((g) => !isManualOnly(g));
  for (let i = 0; i < auto.length; i++) {
    for (let j = i + 1; j < auto.length; j++) {
      const a = auto[i];
      const b = auto[j];
      if (a.gradeMin <= b.gradeMax && b.gradeMin <= a.gradeMax) {
        return { ok: false, error: `${a.name.trim()}·${b.name.trim()} 학년 범위가 겹칩니다.` };
      }
    }
  }

  const warnings: string[] = [];
  for (let grade = 1; grade <= 12; grade++) {
    if (!auto.some((g) => g.gradeMin <= grade && grade <= g.gradeMax)) {
      warnings.push(`${gradeLabel(grade)}이 어느 그룹에도 없습니다.`);
    }
  }
  return { ok: true, warnings };
}
