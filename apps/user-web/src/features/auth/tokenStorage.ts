const KEYS = {
  ACCESS: "access_token",
  REFRESH: "refresh_token",
} as const;

export function getAccessToken(): string | null {
  return localStorage.getItem(KEYS.ACCESS);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(KEYS.ACCESS, token);
}

export function removeAccessToken(): void {
  localStorage.removeItem(KEYS.ACCESS);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(KEYS.REFRESH);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(KEYS.REFRESH, token);
}

export function removeRefreshToken(): void {
  localStorage.removeItem(KEYS.REFRESH);
}

export function clearTokens(): void {
  removeAccessToken();
  removeRefreshToken();
}
