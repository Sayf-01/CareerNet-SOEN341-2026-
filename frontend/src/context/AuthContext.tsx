// ─── AuthProvider = stores who is logged in, for the whole app ───
// the ONLY file that reads/writes the login data in localStorage
// components use useAuth() instead of checking localStorage themselves

import { useState, type ReactNode } from "react";
import { AuthContext, type AuthUser } from "./authState";

// where the token + user are saved in the browser
// "access_token" = same key Krish's ProtectedRoute used ---> nothing breaks
const TOKEN_KEY = "access_token";
const USER_KEY = "auth_user";

// read the saved user back from storage
// try/catch ---> if what's saved is broken, treat it as not logged in
function loadUser(): AuthUser | null {
  try {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? (JSON.parse(saved) as AuthUser) : null;
  } catch {
    return null;
  }
}

// ─── AuthProvider = holds the auth state + shares it with every component inside it ───
// children = everything wrapped inside it (in App.tsx: the whole app)
export function AuthProvider({ children }: { children: ReactNode }) {
  // () => ... = only read storage ONCE, when the app starts
  // ---> refreshing the page keeps you logged in
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const login = (newToken: string, newUser?: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);

    if (newUser) {
      // JSON.stringify = turn the object into text (storage only holds text)
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  // value = what every component inside the Provider can read with useAuth()
  // !!token = turn the token into true/false
  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}