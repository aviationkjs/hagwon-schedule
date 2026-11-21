import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import { FakeAuth, fakeProfile } from "./test/fakeAuth";

vi.mock("./lib/firebase", () => ({ db: {}, auth: {} }));
vi.mock("./data", async (orig) => {
  const empty = async () => [];
  return {
    ...(await orig<typeof import("./data")>()),
    ACADEMY_ID: "main",
    repo: {
      listNotices: empty,
      listGroups: empty,
      listClasses: empty,
      listStudents: empty,
      getStudents: empty,
      listRequests: empty,
      listSessionsForWeek: empty,
      listInvites: empty,
    },
  };
});

function renderAt(path: string, profile: ReturnType<typeof fakeProfile> | null, signedIn = true) {
  return render(
    <FakeAuth profile={profile} signedIn={signedIn}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </FakeAuth>,
  );
}

it("로그인하지 않으면 로그인 화면", () => {
  renderAt("/", null, false);
  expect(screen.getByRole("button", { name: "Google로 로그인" })).toBeInTheDocument();
});

it("로그인했지만 학원에 연결되지 않았으면 전화번호 연결 화면", () => {
  renderAt("/", null, true);
  expect(screen.getByRole("heading", { name: "학원 연결" })).toBeInTheDocument();
});

it("학부모가 /admin에 들어가면 홈으로 돌아간다", async () => {
  renderAt("/admin", fakeProfile({ role: "parent" }));
  expect(await screen.findByRole("heading", { name: /안녕하세요/ })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "편성 관리" })).not.toBeInTheDocument();
});

it("관리자는 /admin에 들어갈 수 있고 관리 탭이 보인다", async () => {
  renderAt("/admin", fakeProfile({ role: "admin" }));
  expect(await screen.findByRole("heading", { name: "편성 관리" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "관리" })).toBeInTheDocument();
});

it("학부모에게는 관리 탭이 없다", () => {
  renderAt("/", fakeProfile({ role: "parent" }));
  expect(screen.queryByRole("link", { name: "관리" })).not.toBeInTheDocument();
});
