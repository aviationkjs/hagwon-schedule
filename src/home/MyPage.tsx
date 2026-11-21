import { useAuth } from "../auth/AuthProvider";
import { ROLE_LABEL } from "../data";

export function MyPage() {
  const { user, profile, signOut } = useAuth();
  return (
    <div className="page">
      <h2>내 정보</h2>
      <dl className="detail card">
        <dt>이름</dt>
        <dd>{profile?.name}</dd>
        <dt>역할</dt>
        <dd>{profile ? ROLE_LABEL[profile.role] : ""}</dd>
        <dt>계정</dt>
        <dd>{user?.email}</dd>
        <dt>전화번호</dt>
        <dd>{profile?.phone}</dd>
      </dl>
      <p className="muted small">알림 설정은 다음 단계(푸시 알림)에서 추가됩니다.</p>
      <button className="btn" onClick={signOut}>
        로그아웃
      </button>
    </div>
  );
}
