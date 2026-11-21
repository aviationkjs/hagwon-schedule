import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { ClaimPage } from "./auth/ClaimPage";
import { LoginPage } from "./auth/LoginPage";
import { RequireRole } from "./auth/RequireRole";
import { AdminPage } from "./admin/AdminPage";
import { HomePage } from "./home/HomePage";
import { MyPage } from "./home/MyPage";
import { InstallGuide } from "./install/InstallGuide";
import { NoticeBoard } from "./notices/NoticeBoard";
import { RequestsPage } from "./requests/RequestsPage";
import { SchedulePage } from "./schedule/SchedulePage";

/** 로그인 → 학원 연결 → 하단 탭 화면 순으로 보여 준다. */
export function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="center-page muted">불러오는 중…</div>;
  if (!user) return <LoginPage />;
  if (!profile) return <ClaimPage />;

  const tabs = [
    { to: "/", label: "홈" },
    { to: "/schedule", label: "스케줄" },
    { to: "/board", label: "게시판" },
    { to: "/requests", label: "요청" },
    ...(profile.role === "admin" ? [{ to: "/admin", label: "관리" }] : []),
    { to: "/me", label: "내 정보" },
  ];

  return (
    <div className="shell">
      <InstallGuide />
      <main className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/board" element={<NoticeBoard />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route
            path="/admin"
            element={
              <RequireRole roles={["admin"]}>
                <AdminPage />
              </RequireRole>
            }
          />
          <Route path="/me" element={<MyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <nav className="tabbar" aria-label="메뉴">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

// GitHub Pages는 새로고침 시 하위 경로를 모르므로 #/경로 방식 라우터를 쓴다.
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}
