import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfirmDelete } from "./ConfirmDelete";

function setup(onConfirm = vi.fn().mockResolvedValue(undefined)) {
  const onCancel = vi.fn();
  render(<ConfirmDelete title="반 삭제" text="수학 반을 지웁니다." onConfirm={onConfirm} onCancel={onCancel} />);
  return { onConfirm, onCancel, dialog: screen.getByRole("alertdialog", { name: "반 삭제" }) };
}

it("화면 위에 뜨는 팝업이고 취소 버튼에 먼저 초점이 간다", () => {
  const { dialog } = setup();
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(dialog).toHaveTextContent("수학 반을 지웁니다.");
  expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
});

it("삭제를 누르면 onConfirm", async () => {
  const { onConfirm } = setup();
  fireEvent.click(screen.getByRole("button", { name: "삭제" }));
  await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
});

it("Esc나 바깥을 누르면 취소", () => {
  const { onCancel } = setup();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(onCancel).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByTestId("modal-backdrop"));
  expect(onCancel).toHaveBeenCalledTimes(2);
});

it("삭제가 실패하면 팝업 안에 이유를 보여 준다", async () => {
  setup(vi.fn().mockRejectedValue(new Error("권한이 없습니다.")));
  fireEvent.click(screen.getByRole("button", { name: "삭제" }));
  expect(await screen.findByText("권한이 없습니다.")).toBeInTheDocument();
});
