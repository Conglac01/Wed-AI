import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(true);

  function resetForm() { setFullName(""); setEmail(""); setPassword(""); setConfirmPassword(""); setAgreeTerms(false); setNewsletter(true); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); setSuccess(null);
    if (!email || !password) { setError("Vui lòng nhập email và mật khẩu."); return; }
    if (password.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự."); return; }
    if (password !== confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }
    if (!agreeTerms) { setError("Vui lòng đồng ý với điều khoản sử dụng."); return; }
    setLoading(true);
    try { await register({ email, password, full_name: fullName || undefined }); resetForm(); setSuccess("Đăng ký thành công. Vui lòng đăng nhập."); setTimeout(() => navigate("/login", { replace: true }), 2000); }
    catch (err) { setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12" style={{ backgroundColor: "#F8F9FB" }}>
      <div className="w-full max-w-[440px]">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản mới</h1>
          <p className="mt-2 text-sm text-gray-500">Đăng ký nhanh chóng để khám phá hàng ngàn cơ hội việc làm IT phù hợp với bạn.</p>
        </div>

        {error && <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }} role="alert">{error}</div>}
        {success && <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#ECFDF5", color: "#10B981" }} role="status">{success}</div>}

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border bg-white py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#0047CC]" style={{ borderColor: "#EBEBEB", height: "48px" }} placeholder="Họ và tên" autoComplete="name" />
          </div>

          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border bg-white py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#0047CC]" style={{ borderColor: "#EBEBEB", height: "48px" }} placeholder="Nhập email của bạn" autoComplete="email" />
          </div>

          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border bg-white py-3 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#0047CC]" style={{ borderColor: "#EBEBEB", height: "48px" }} placeholder="Nhập mật khẩu" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
          </div>

          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border bg-white py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#0047CC]" style={{ borderColor: "#EBEBEB", height: "48px" }} placeholder="Nhập lại mật khẩu" autoComplete="new-password" />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex cursor-pointer items-start gap-2">
              <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-[#0047CC]" />
              <span className="text-sm text-gray-700">Nhận bản tin việc làm phù hợp với bạn</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2">
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-[#0047CC]" />
              <span className="text-sm text-gray-700">Tôi đồng ý với <a href="#" className="text-[#0047CC] underline" onClick={(e) => e.preventDefault()}>Điều khoản dịch vụ</a></span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-lg text-sm font-bold text-white transition-colors disabled:cursor-not-allowed" style={{ backgroundColor: loading ? "#CCCCCC" : "#0047CC", height: "48px" }}>
            {loading ? "Đang tạo tài khoản..." : "Đăng ký tài khoản"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}<Link to="/login" className="font-semibold text-[#0047CC] hover:underline">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}
