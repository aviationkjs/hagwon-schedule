import { render, screen, fireEvent } from "@testing-library/react";
import { WeekView } from "./WeekView";
import type { ClassInfo, Session } from "../data/types";

const classes: ClassInfo[] = [{ id: "c1", name: "중등 수학", teacherId: "t1", teacherName: "김강사", room: "1실", groupIds: [] }];
const sessions: Session[] = [
  { id: "s1", classId: "c1", teacherId: "t1", room: "1실", startAt: new Date(2026, 10, 23, 14), endAt: new Date(2026, 10, 23, 15, 30), status: "예정" },
];

it("월요일 14:00 수업이 월요일 칸에 있고 누르면 onSelect가 호출된다", () => {
  const onSelect = vi.fn();
  render(<WeekView weekStart={new Date(2026, 10, 23)} sessions={sessions} classes={classes} onSelect={onSelect} />);
  const monday = screen.getByRole("region", { name: /11\/23 \(월\)/ });
  expect(monday).toHaveTextContent("14:00");
  expect(monday).toHaveTextContent("중등 수학");
  fireEvent.click(screen.getByRole("button", { name: /중등 수학/ }));
  expect(onSelect).toHaveBeenCalledWith("s1");
});
