import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthState, CurrentUser, LoginPayload, RegisterPayload } from "./types";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "./tokenStorage";
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  getCurrentUser as apiGetMe,
} from "@/shared/services/authService";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ------------------------------------------------------------------
  // Init — attempt to restore session from localStorage
  // ------------------------------------------------------------------

  // Load user once at mount. Must use navigate() inside a Router boundary.
  const loadCurrentUser = useCallback(async (token: string) => {
    try {
      const u = await apiGetMe(token);
      setUser(u);
      setAccessTokenState(token);
      return true;
    } catch {
      clearTokens();
      setUser(null);
      setAccessTokenState(null);
      setRefreshTokenState(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const savedAccess = getAccessToken();
    const savedRefresh = getRefreshToken();

    if (savedAccess) {
      setRefreshTokenState(savedRefresh);
      loadCurrentUser(savedAccess).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [loadCurrentUser]);

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await apiLogin(payload);
    setAccessToken(res.access_token);
    if (res.refresh_token) {
      setRefreshToken(res.refresh_token);
    }
    setAccessTokenState(res.access_token);
    setRefreshTokenState(res.refresh_token);

    // Fetch user profile
    const u = await apiGetMe(res.access_token);
    setUser(u);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiRegister(payload);
    // User must login after registration — no auto-login.
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setAccessTokenState(null);
    setRefreshTokenState(null);
  }, []);

  // ------------------------------------------------------------------
  // Value
  // ------------------------------------------------------------------

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, accessToken, refreshToken, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
