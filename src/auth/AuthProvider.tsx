import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { repo, type UserProfile } from "../data";

export type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const v = useContext(AuthContext);
  if (!v) throw new Error("AuthProvider 밖에서 useAuth를 썼습니다.");
  return v;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (u: User | null) => {
    setProfile(u ? await repo.getProfile(u.uid) : null);
  }, []);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setLoading(true);
        setUser(u);
        try {
          await loadProfile(u);
        } finally {
          setLoading(false);
        }
      }),
    [loadProfile],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      loading,
      refreshProfile: () => loadProfile(user),
      signOut: () => fbSignOut(auth),
    }),
    [user, profile, loading, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
