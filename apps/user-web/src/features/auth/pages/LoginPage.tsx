import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError("Vui lòng nhập email và mật khẩu."); return; }
    setLoading(true);
    try { await login({ email, password }); navigate(redirectTo, { replace: true }); }
    catch (err) { setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12" style={{ backgroundColor: "#F8F9FB" }}>
      <div className="w-full max-w-[440px]">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Chào mừng bạn trở lại!</h1>
          <p className="mt-2 text-sm text-gray-500">Đăng nhập để tiếp tục khám phá hàng ngàn cơ hội việc làm IT.</p>
        </div>

        {error && <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }} role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border bg-white py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#0047CC]" style={{ borderColor: "#EBEBEB", height: "48px" }} placeholder="Nhập email của bạn" autoComplete="email" />
          </div>

          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border bg-white py-3 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#0047CC]" style={{ borderColor: "#EBEBEB", height: "48px" }} placeholder="Nhập mật khẩu" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-[#0047CC]" />
              <span className="text-sm text-gray-700">Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" className="text-sm font-medium text-[#0047CC] hover:underline">Quên mật khẩu?</a>
          </div>

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-lg text-sm font-bold text-white transition-colors disabled:cursor-not-allowed" style={{ backgroundColor: loading ? "#CCCCCC" : "#0047CC", height: "48px" }}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-5 relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: "#EBEBEB" }} /></div>
          <div className="relative flex justify-center"><span className="bg-[#F8F9FB] px-3 text-xs text-gray-400">hoặc</span></div>
        </div>

        <button type="button" disabled className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg border bg-white py-3 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: "#EBEBEB", height: "48px" }}>
          <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          Đăng nhập với Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          Chưa có tài khoản?{" "}<Link to="/register" className="font-semibold text-[#0047CC] hover:underline">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
