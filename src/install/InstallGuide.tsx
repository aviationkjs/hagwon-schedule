import { useState } from "react";
import { installHint } from "./installHint";

const DISMISS_KEY = "install-guide-dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** 홈 화면에 추가하지 않은 사용자에게 설치 방법을 안내한다. */
export function InstallGuide() {
  const [dismissed, setDismissed] = useState(readDismissed);
  const standalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const hint = installHint(navigator.userAgent, standalone);
  if (!hint || dismissed) return null;

  return (
    <div className="install-guide" role="note">
      <p>{hint}</p>
      <button
        className="btn link"
        onClick={() => {
          setDismissed(true);
          try {
            localStorage.setItem(DISMISS_KEY, "1");
          } catch {
            /* 저장이 막혀 있으면 이번 화면에서만 숨긴다 */
          }
        }}
      >
        닫기
      </button>
    </div>
  );
}
