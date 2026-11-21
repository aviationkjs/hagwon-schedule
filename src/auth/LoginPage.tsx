import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth } from "../lib/firebase";

export function LoginPage() {
  const [error, setError] = useState("");

  async function login() {
    setError("");
    const provider = new GoogleAuthProvider();
    const fail = (e: unknown) => {
      const code = (e as { code?: string }).code ?? "unknown";
      setError(`로그인하지 못했습니다. 잠시 후 다시 시도해 주세요. (${code})`);
    };
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e as { code?: string }).code;
      // 홈 화면 앱에서 팝업이 막히면 페이지 이동 방식으로 다시 시도한다.
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, provider).catch(fail);
      } else if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        fail(e);
      }
    }
  }

  return (
    <div className="center-page">
      <h1>학원 스케줄</h1>
      <p className="muted">수업 일정, 공지, 변경 요청을 한 곳에서</p>
      <button className="btn primary" onClick={login}>
        Google로 로그인
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
