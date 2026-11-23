import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  /** 팝업 제목 (예: "반 삭제") */
  title?: string;
  text: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

/**
 * 되돌릴 수 없는 삭제 전에 화면 가운데 뜨는 확인 팝업.
 * 실수를 막으려고 '취소'에 먼저 초점을 두고, Esc나 바깥을 누르면 취소한다.
 */
export function ConfirmDelete({ title = "삭제할까요?", text, confirmLabel = "삭제", onConfirm, onCancel }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

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

  return createPortal(
    <div className="modal-backdrop" data-testid="modal-backdrop" onClick={() => !busy && onCancel()}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        <p>{text}</p>
        <p className="muted small">삭제하면 되돌릴 수 없습니다.</p>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button ref={cancelRef} className="btn" disabled={busy} onClick={onCancel}>
            취소
          </button>
          <button className="btn danger-strong" disabled={busy} onClick={confirm}>
            {busy ? "지우는 중…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
