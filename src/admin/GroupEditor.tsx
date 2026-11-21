import { useEffect, useState } from "react";
import { repo, ACADEMY_ID } from "../data";
import { DEFAULT_GROUPS, type Group } from "../domain/group";
import { gradeLabel } from "../domain/grade";
import { useLoad } from "../lib/useLoad";
import { validateGroupsForSave } from "./validate";

const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export function GroupEditor({ onSaved }: { onSaved?: () => void }) {
  const loaded = useLoad(() => repo.listGroups(ACADEMY_ID), []);
  const [groups, setGroups] = useState<Group[]>([]);
  const [message, setMessage] = useState<{ kind: "error" | "ok" | "warn"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loaded.data) {
      const sorted = [...loaded.data].sort((x, y) => x.gradeMin - y.gradeMin);
      setGroups(sorted.length ? sorted : DEFAULT_GROUPS);
    }
  }, [loaded.data]);

  const update = (i: number, patch: Partial<Group>) =>
    setGroups(groups.map((g, j) => (j === i ? { ...g, ...patch } : g)));

  async function save() {
    const result = validateGroupsForSave(groups);
    if (!result.ok) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    setBusy(true);
    try {
      await repo.saveGroups(ACADEMY_ID, groups.map((g) => ({ ...g, name: g.name.trim() })));
      setMessage(
        result.warnings.length
          ? { kind: "warn", text: `저장했습니다. 확인: ${result.warnings.join(" ")}` }
          : { kind: "ok", text: "저장했습니다." },
      );
      onSaved?.();
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "저장하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  const manual = (g: Group) => g.gradeMin === 0 && g.gradeMax === 0;

  return (
    <div className="stack">
      <p className="notice-box">
        저장하면 바로 적용됩니다. 학년은 매년 1월 1일 기준으로 생년에서 계산합니다. "수동 지정 전용" 그룹은 학년으로
        자동 배정되지 않고, 학생 화면에서 직접 지정한 학생만 들어갑니다.
      </p>
      {loaded.loading && <p className="muted">불러오는 중…</p>}
      {groups.map((g, i) => (
        <div key={g.id} className="card row gap wrap">
          <input className="input grow" aria-label="그룹 이름" value={g.name} onChange={(e) => update(i, { name: e.target.value })} />
          <label className="row gap small">
            <input
              type="checkbox"
              checked={manual(g)}
              onChange={(e) => update(i, e.target.checked ? { gradeMin: 0, gradeMax: 0 } : { gradeMin: 1, gradeMax: 1 })}
            />
            수동 지정 전용
          </label>
          {!manual(g) && (
            <span className="row gap">
              <select aria-label="시작 학년" value={g.gradeMin} onChange={(e) => update(i, { gradeMin: Number(e.target.value) })}>
                {GRADE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{gradeLabel(n)}</option>
                ))}
              </select>
              ~
              <select aria-label="끝 학년" value={g.gradeMax} onChange={(e) => update(i, { gradeMax: Number(e.target.value) })}>
                {GRADE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{gradeLabel(n)}</option>
                ))}
              </select>
            </span>
          )}
          <button className="btn link danger" onClick={() => setGroups(groups.filter((_, j) => j !== i))}>
            삭제
          </button>
        </div>
      ))}
      <div className="row gap">
        <button
          className="btn"
          onClick={() => setGroups([...groups, { id: `g${Date.now()}`, name: "새 그룹", gradeMin: 0, gradeMax: 0 }])}
        >
          그룹 추가
        </button>
        <button className="btn primary" disabled={busy} onClick={save}>
          저장
        </button>
      </div>
      {message && <p className={message.kind === "error" ? "error" : message.kind === "warn" ? "warn" : "ok"}>{message.text}</p>}
    </div>
  );
}
