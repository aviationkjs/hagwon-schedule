import { useState } from "react";

/** 되돌릴 수 없는 삭제 전 한 번 더 묻는 칸 */
export function ConfirmDelete({
  text,
  onConfirm,
  onCancel,
}: {
  text: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제하지 못했습니다.");
      setBusy(false);
    }
  }

  return (
    <div className="confirm" role="alertdialog" aria-label="삭제 확인">
      <p>{text}</p>
      <div className="row gap">
        <button className="btn danger" disabled={busy} onClick={confirm}>
          삭제
        </button>
        <button className="btn" disabled={busy} onClick={onCancel}>
          취소
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
