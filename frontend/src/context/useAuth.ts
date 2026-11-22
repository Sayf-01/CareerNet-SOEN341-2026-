// ─── useAuth = read the auth state from any component ───
// ex: const { user, logout } = useAuth();
// (own file because Vite's live reload wants component files to only export components)

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./authState";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  // null = used outside the Provider ---> throw an error so the mistake is obvious
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return context;
}