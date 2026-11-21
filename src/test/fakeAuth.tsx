import type { ReactNode } from "react";
import { AuthContext, type AuthState } from "../auth/AuthProvider";
import type { UserProfile } from "../data/types";

export function fakeProfile(p: Partial<UserProfile> = {}): UserProfile {
  return { uid: "p1", academyId: "main", role: "parent", name: "학부모1", phone: "01000000003", studentIds: ["s1"], classIds: ["c1"], ...p };
}

export function FakeAuth({ profile, children }: { profile: UserProfile | null; children: ReactNode }) {
  const value: AuthState = {
    user: profile ? ({ uid: profile.uid, email: "test@example.com" } as AuthState["user"]) : null,
    profile,
    loading: false,
    refreshProfile: async () => {},
    signOut: async () => {},
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
