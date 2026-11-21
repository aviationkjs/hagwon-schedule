import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";
import { repo, ACADEMY_ID } from "../data";
import { normalizePhone } from "../domain/phone";

/** 로그인했지만 프로필이 없는 사용자: 학원에 등록된 전화번호로 연결한다. */
export function ClaimPage() {
  const { user, refreshProfile, signOut } = useAuth();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("휴대폰 번호를 확인해 주세요. 예: 010-1234-5678");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await repo.claimInvite(ACADEMY_ID, user!.uid, normalized);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "연결하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-page">
      <h1>학원 연결</h1>
      <p className="muted">{user?.email} 계정으로 로그인했습니다.</p>
      <p>학원에 등록한 휴대폰 번호를 입력하세요.</p>
      <form onSubmit={submit} className="stack">
        <input
          className="input"
          inputMode="tel"
          placeholder="010-1234-5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-label="휴대폰 번호"
        />
        <button className="btn primary" disabled={busy}>
          연결하기
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      <button className="btn link" onClick={signOut}>
        다른 계정으로 로그인
      </button>
    </div>
  );
}
