import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { canSeeAllClasses } from "../auth/roles";
import { repo, ACADEMY_ID, type Board, type Notice } from "../data";
import { ConfirmDelete } from "../admin/ConfirmDelete";
import { dateTimeLabel } from "../lib/format";
import { useLoad } from "../lib/useLoad";
import { NoticeForm } from "./NoticeForm";
import { canDeletePost, sortNotices, targetLabel, visibleTo } from "./target";
import { useViewer } from "./useViewer";

const BOARDS: Board[] = ["공지", "자유"];
const BOARD_LABEL: Record<Board, string> = { 공지: "공지", 자유: "자유 의견" };

export function NoticeBoard() {
  const { profile } = useAuth();
  const me = profile!;
  const isStaff = canSeeAllClasses(me.role); // 관리자·강사 = 운영진
  const [board, setBoard] = useState<Board>("공지");
  const [writing, setWriting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const viewer = useViewer();
  const notices = useLoad(() => repo.listNotices(ACADEMY_ID), []);
  // 비밀글: 운영진은 전부, 학부모·학생은 자기 글만
  const privatePosts = useLoad(() => repo.listPrivatePosts(ACADEMY_ID, isStaff ? undefined : me.uid), [isStaff, me.uid]);

  const ctx = viewer.data;
  const canWrite = me.role === "admin" || board === "자유";
  const names = {
    groups: new Map((ctx?.groups ?? []).map((g) => [g.id, g.name])),
    classes: new Map((ctx?.classes ?? []).map((c) => [c.id, c.name])),
    students: new Map((ctx?.students ?? []).map((s) => [s.id, s.name])),
  };
  const publicPosts = (notices.data ?? []).filter((n) => n.board === board && ctx && visibleTo(n, ctx.viewer));
  const shown = ctx ? sortNotices([...publicPosts, ...(board === "자유" ? (privatePosts.data ?? []) : [])]) : [];
  const loading = notices.loading || viewer.loading || privatePosts.loading;
  const error = notices.error || viewer.error || privatePosts.error;

  const reload = () => Promise.all([notices.reload(), privatePosts.reload()]);

  async function remove(post: Notice) {
    if (post.private) await repo.deletePrivatePost(ACADEMY_ID, post.id);
    else await repo.deleteNotice(ACADEMY_ID, post.id);
    setDeleting(null);
    await reload();
  }

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

      {board === "자유" && !isStaff && (
        <p className="notice-box">여기에 쓴 글은 강사·관리자만 볼 수 있습니다. 다른 학부모·학생에게는 보이지 않습니다.</p>
      )}

      {canWrite && !writing && (
        <button className="btn primary" onClick={() => setWriting(true)}>
          {board === "공지" ? "공지 쓰기" : isStaff ? "의견 쓰기" : "운영진에게 글쓰기"}
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
            void reload();
          }}
        />
      )}

      {loading && <p className="muted">불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && shown.length === 0 && <p className="muted">글이 없습니다.</p>}

      <ul className="list">
        {shown.map((n) => (
          <li key={`${n.private ? "p" : "n"}-${n.id}`} className={`card ${n.pinned ? "pinned" : ""}`}>
            <button className="notice-head" onClick={() => setOpenId(openId === n.id ? null : n.id)} aria-expanded={openId === n.id}>
              <span>
                {n.pinned && <span className="badge">고정</span>}
                {n.private && <span className="badge private">운영진만 보기</span>} <strong>{n.title}</strong>
              </span>
              <span className="muted small">
                {n.authorName} · {dateTimeLabel(n.createdAt)}
                {!n.private && ` · ${targetLabel(n.target, names)}`}
              </span>
            </button>
            {openId === n.id && <p className="notice-body">{n.body}</p>}
            {openId === n.id && canDeletePost(n, me.role, me.uid) && deleting !== n.id && (
              <div className="row gap">
                <button className="btn danger" onClick={() => setDeleting(n.id)}>
                  삭제
                </button>
              </div>
            )}
            {deleting === n.id && (
              <ConfirmDelete
                text={`'${n.title}' 글을 지웁니다. 되돌릴 수 없습니다.`}
                onCancel={() => setDeleting(null)}
                onConfirm={() => remove(n)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
