// ─── auth state: the shape of the login data + the context object ───
// (own file because Vite's live reload wants AuthContext.tsx to only export the Provider)

import { createContext } from "react";
import type { LoginResponse } from "../types/auth";

// the user info the backend sends back on login ({ id, email, role })
// NonNullable = "the real object, not undefined"
export type AuthUser = NonNullable<LoginResponse["user"]>;

// what every component gets from useAuth()
export interface AuthContextValue {
  token: string | null; // the token, or null if nobody's logged in
  user: AuthUser | null; // who's logged in, or null
  isAuthenticated: boolean; // shortcut ---> true if there's a token
  login: (token: string, user?: AuthUser) => void; // save the token + user
  logout: () => void; // clear the token + user
}

// createContext = creates the context (null until AuthProvider gives it a value)
export const AuthContext = createContext<AuthContextValue | null>(null);