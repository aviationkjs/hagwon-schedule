import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { repo, ACADEMY_ID, type Board } from "../data";
import { dateTimeLabel } from "../lib/format";
import { useLoad } from "../lib/useLoad";
import { NoticeForm } from "./NoticeForm";
import { sortNotices, targetLabel, visibleTo } from "./target";
import { useViewer } from "./useViewer";

const BOARDS: Board[] = ["공지", "자유"];
const BOARD_LABEL: Record<Board, string> = { 공지: "공지", 자유: "자유 의견" };

export function NoticeBoard() {
  const { profile } = useAuth();
  const [board, setBoard] = useState<Board>("공지");
  const [writing, setWriting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const viewer = useViewer();
  const notices = useLoad(() => repo.listNotices(ACADEMY_ID), []);

  const ctx = viewer.data;
  const canWrite = profile!.role === "admin" || board === "자유";
  const names = {
    groups: new Map((ctx?.groups ?? []).map((g) => [g.id, g.name])),
    classes: new Map((ctx?.classes ?? []).map((c) => [c.id, c.name])),
    students: new Map((ctx?.students ?? []).map((s) => [s.id, s.name])),
  };
  const shown = ctx ? sortNotices((notices.data ?? []).filter((n) => n.board === board && visibleTo(n, ctx.viewer))) : [];
  const loading = notices.loading || viewer.loading;

  return (
    <div className="page">
      <div className="tabs" role="tablist">
        {BOARDS.map((b) => (
          <button
            key={b}
            role="tab"
            aria-selected={board === b}
            className={board === b ? "tab active" : "tab"}
            onClick={() => {
              setBoard(b);
              setWriting(false);
            }}
          >
            {BOARD_LABEL[b]}
          </button>
        ))}
      </div>

      {canWrite && !writing && (
        <button className="btn primary" onClick={() => setWriting(true)}>
          {board === "공지" ? "공지 쓰기" : "의견 쓰기"}
        </button>
      )}
      {writing && ctx && (
        <NoticeForm
          board={board}
          groups={ctx.groups}
          classes={ctx.classes}
          students={ctx.students}
          onDone={() => {
            setWriting(false);
            void notices.reload();
          }}
        />
      )}

      {loading && <p className="muted">불러오는 중…</p>}
      {(notices.error || viewer.error) && <p className="error">{notices.error || viewer.error}</p>}
      {!loading && shown.length === 0 && <p className="muted">글이 없습니다.</p>}

      <ul className="list">
        {shown.map((n) => (
          <li key={n.id} className={`card ${n.pinned ? "pinned" : ""}`}>
            <button className="notice-head" onClick={() => setOpenId(openId === n.id ? null : n.id)} aria-expanded={openId === n.id}>
              <span>
                {n.pinned && <span className="badge">고정</span>} <strong>{n.title}</strong>
              </span>
              <span className="muted small">
                {n.authorName} · {dateTimeLabel(n.createdAt)} · {targetLabel(n.target, names)}
              </span>
            </button>
            {openId === n.id && <p className="notice-body">{n.body}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
