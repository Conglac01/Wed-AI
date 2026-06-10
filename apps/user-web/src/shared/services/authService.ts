import { config } from "@/app/config";
import type {
  RegisterPayload,
  LoginPayload,
  TokenResponse,
  CurrentUser,
} from "@/features/auth/types";

// ---------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------

const ERROR_MAP: Record<string, string> = {
  "Email already registered":
    "Email này đã được đăng ký. Vui lòng sử dụng email khác.",
  "Password must be at least 8 characters":
    "Mật khẩu phải có ít nhất 8 ký tự.",
  "Invalid email or password": "Email hoặc mật khẩu không đúng.",
};

function humanError(status: number, body: unknown): string {
  if (status === 422 && typeof body === "object" && body !== null) {
    // Pydantic validation detail — try to extract a friendly message
    const detail = (body as Record<string, unknown>)["detail"];
    if (Array.isArray(detail) && detail.length > 0) {
      const msg = (detail[0] as Record<string, string>)["msg"] ?? "";
      for (const [key, value] of Object.entries(ERROR_MAP)) {
        if (msg.includes(key)) return value;
      }
    }
  }

  if (typeof body === "object" && body !== null) {
    const detail = (body as Record<string, string>)["detail"];
    if (typeof detail === "string" && ERROR_MAP[detail]) {
      return ERROR_MAP[detail];
    }
    if (typeof detail === "string") return detail;
  }

  if (status === 500) return "Hệ thống đang gặp lỗi. Vui lòng thử lại sau.";
  return "Đã xảy ra lỗi không xác định.";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${config.apiBaseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Không thể kết nối tới máy chủ. Vui lòng kiểm tra internet.",
    );
  }

  const body = await res.json().catch(() => undefined);

  if (!res.ok) {
    throw new Error(humanError(res.status, body));
  }

  return body as T;
}

function authRequest<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  return request<T>(path, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function registerUser(payload: RegisterPayload): Promise<CurrentUser> {
  return request<CurrentUser>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload: LoginPayload): Promise<TokenResponse> {
  return request<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser(
  accessToken: string,
): Promise<CurrentUser> {
  return authRequest<CurrentUser>("/api/v1/auth/me", accessToken);
}

export function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  return request<TokenResponse>("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}
