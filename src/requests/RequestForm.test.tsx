import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequestForm } from "./RequestForm";
import { FakeAuth, fakeProfile } from "../test/fakeAuth";
import type { Session } from "../data/types";

const createRequest = vi.fn().mockResolvedValue("r1");
vi.mock("../lib/firebase", () => ({ db: {}, auth: {} }));
vi.mock("../data", async (orig) => ({
  ...(await orig<typeof import("../data")>()),
  repo: { createRequest: (...args: unknown[]) => createRequest(...args) },
  ACADEMY_ID: "main",
}));

const session: Session = {
  id: "s1", classId: "c1", teacherId: "t1", room: "1실",
  startAt: new Date(2026, 10, 23, 14), endAt: new Date(2026, 10, 23, 15), status: "예정",
};

function setup() {
  const onDone = vi.fn();
  render(
    <FakeAuth profile={fakeProfile()}>
      <RequestForm session={session} onDone={onDone} />
    </FakeAuth>,
  );
  fireEvent.click(screen.getByRole("button", { name: "변경 요청" }));
  return { onDone };
}

it("사유가 비어 있으면 제출 버튼이 비활성화된다", () => {
  setup();
  expect(screen.getByRole("button", { name: "요청 보내기" })).toBeDisabled();
});

it("희망 일시와 사유를 채우면 createRequest가 한 번 호출된다", async () => {
  const { onDone } = setup();
  fireEvent.change(screen.getByLabelText("희망 시작"), { target: { value: "2026-11-24T16:00" } });
  fireEvent.change(screen.getByLabelText("희망 종료"), { target: { value: "2026-11-24T17:00" } });
  fireEvent.change(screen.getByLabelText("사유"), { target: { value: "병원 예약" } });
  fireEvent.click(screen.getByRole("button", { name: "요청 보내기" }));
  await waitFor(() => expect(createRequest).toHaveBeenCalledTimes(1));
  expect(createRequest).toHaveBeenCalledWith("main", {
    sessionId: "s1", classId: "c1", requesterUid: "p1", requesterName: "학부모1", reason: "병원 예약",
    desiredStart: new Date(2026, 10, 24, 16), desiredEnd: new Date(2026, 10, 24, 17),
  });
  await waitFor(() => expect(onDone).toHaveBeenCalled());
});

it("종료가 시작보다 빠르면 제출할 수 없다", () => {
  setup();
  fireEvent.change(screen.getByLabelText("희망 시작"), { target: { value: "2026-11-24T17:00" } });
  fireEvent.change(screen.getByLabelText("희망 종료"), { target: { value: "2026-11-24T16:00" } });
  fireEvent.change(screen.getByLabelText("사유"), { target: { value: "x" } });
  expect(screen.getByRole("button", { name: "요청 보내기" })).toBeDisabled();
});
