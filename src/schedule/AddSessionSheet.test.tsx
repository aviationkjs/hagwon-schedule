import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AddSessionSheet } from "./AddSessionSheet";
import type { ClassInfo } from "../data/types";

vi.mock("../lib/firebase", () => ({ db: {}, auth: {} }));
vi.mock("../data", async (orig) => ({
  ...(await orig<typeof import("../data")>()),
  ACADEMY_ID: "main",
  repo: { createWeeklySessions: vi.fn().mockResolvedValue(1) },
}));

const classes: ClassInfo[] = [{ id: "c1", name: "중등 수학", teacherId: "t1", teacherName: "김강사", room: "1실", groupIds: [] }];

function setup() {
  render(
    <MemoryRouter>
      <AddSessionSheet
        classes={classes}
        start={new Date(2026, 10, 24, 16, 0)}
        end={new Date(2026, 10, 24, 17, 30)}
        onClose={() => {}}
        onSaved={() => {}}
      />
    </MemoryRouter>,
  );
  return {
    start: screen.getByLabelText("시작") as HTMLInputElement,
    end: screen.getByLabelText("끝") as HTMLInputElement,
    save: () => screen.getByRole("button", { name: /수업 .*추가/ }),
  };
}

it("시작을 늦추면 종료도 같은 길이만큼 따라간다", () => {
  const { start, end } = setup();
  fireEvent.change(start, { target: { value: "18:00" } });
  expect(end.value).toBe("19:30");
});

it("종료 입력칸은 시작 이후만 고를 수 있다", () => {
  const { start, end } = setup();
  expect(end.min).toBe("16:01");
  fireEvent.change(start, { target: { value: "18:00" } });
  expect(end.min).toBe("18:01");
});

it("종료를 시작보다 앞으로 넣으면 안내가 뜨고 저장할 수 없다", () => {
  const { end, save } = setup();
  fireEvent.change(end, { target: { value: "15:00" } });
  expect(screen.getByText(/시작\(16:00\) 이후로만/)).toBeInTheDocument();
  expect(save()).toBeDisabled();
});
