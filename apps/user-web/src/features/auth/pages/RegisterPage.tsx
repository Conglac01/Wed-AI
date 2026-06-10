import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

/* ── Benefit card (same pattern as login) ─────────────────── */
function BenefitCard({
  icon,
  bgColor,
  title,
  desc,
}: {
  icon: React.ReactNode;
  bgColor: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl px-5 py-4">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: bgColor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-gray-500">
          {desc}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Register Page
   ══════════════════════════════════════════════════════════════ */
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(true);

  function resetForm() {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAgreeTerms(false);
    setNewsletter(true);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Mật khẩu phải có ít nhất 8 ký tự. Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (!agreeTerms) {
      setError("Vui lòng đồng ý với điều khoản sử dụng.");
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, full_name: fullName || undefined });
      resetForm();
      setSuccess("Đăng ký thành công. Vui lòng đăng nhập.");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 px-4 lg:grid-cols-[1fr_1.5fr] lg:gap-12 lg:px-8 mx-auto max-w-[1400px] min-h-[calc(100vh-64px)]">
      {/* ═══ Form Section (left) ═══════════════════════════════ */}
      <section
        className="flex min-h-full items-center justify-center overflow-y-auto px-4 py-10 lg:px-8 lg:py-12"
        style={{ backgroundColor: "#F8F9FB" }}
      >
        <div className="w-full max-w-[480px]">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-bold" style={{ fontSize: "24px", color: "#1A1A1A" }}>
              Tạo tài khoản mới
            </h1>
            <p className="mt-1 font-semibold" style={{ fontSize: "14px", color: "#666666" }}>
              Tham gia VIECCONNECT IT JOBS
            </p>
            <p className="mt-1 leading-relaxed" style={{ fontSize: "14px", color: "#666666" }}>
              Đăng ký nhanh chóng để khám phá hàng ngàn cơ hội việc làm phù hợp
              với nâng lực của bạn.
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="mt-6">
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-3 rounded-lg border bg-white py-3 text-sm font-medium text-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "#EBEBEB", height: "48px" }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Đăng nhập với Google
            </button>
          </div>

          {/* "hoặc" divider */}
          <div className="mb-4 mt-[16px] flex items-center gap-3">
            <div className="flex-1 border-t" style={{ borderColor: "#EBEBEB" }} />
            <span className="text-xs text-gray-400">hoặc</span>
            <div className="flex-1 border-t" style={{ borderColor: "#EBEBEB" }} />
          </div>

          {/* Error / Success */}
          {error && (
            <div
              className="mb-4 rounded-lg px-4 py-3 text-sm"
              style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}
              role="alert"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="mb-4 rounded-lg px-4 py-3 text-sm"
              style={{ backgroundColor: "#ECFDF5", color: "#10B981" }}
              role="status"
            >
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            {/* Full name */}
            <div>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <input
                  id="reg-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border bg-white py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:ring-2"
                  style={{
                    borderColor: "#EBEBEB",
                    height: "48px",
                    fontSize: "14px",
                  }}
                  placeholder="Họ và tên"
                  autoComplete="name"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Nhà tuyển dụng có thể thấy tên bạn khi xem hồ sơ
              </p>
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border bg-white py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:ring-2"
                  style={{
                    borderColor: "#EBEBEB",
                    height: "48px",
                    fontSize: "14px",
                  }}
                  placeholder="Nhập email của bạn"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border bg-white py-3 pl-10 pr-10 text-sm outline-none transition-colors focus:ring-2"
                  style={{
                    borderColor: "#EBEBEB",
                    height: "48px",
                    fontSize: "14px",
                  }}
                  placeholder="Nhập mật khẩu"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border bg-white py-3 pl-10 pr-10 text-sm outline-none transition-colors focus:ring-2"
                  style={{
                    borderColor: "#EBEBEB",
                    height: "48px",
                    fontSize: "14px",
                  }}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-1">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-[#1E5FD4]"
                />
                <span className="text-sm text-gray-700">
                  Nhận bản tin việc làm phù hợp với bạn
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={showPassword || showConfirm}
                  onChange={(e) => {
                    setShowPassword(e.target.checked);
                    setShowConfirm(e.target.checked);
                  }}
                  className="mt-0.5 h-4 w-4 rounded accent-[#1E5FD4]"
                />
                <span className="text-sm text-gray-700">
                  Hiện thị mật khẩu
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-[#1E5FD4]"
                />
                <span className="text-sm text-gray-700">
                  Tôi đồng ý với việc xử lý và cung cấp thông tin tin dữ liệu
                  cá nhân{" "}
                  <a
                    href="#"
                    className="underline"
                    style={{ color: "#1E5FD4" }}
                    onClick={(e) => e.preventDefault()}
                  >
                    Điều khoản dịch vụ
                  </a>
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg text-sm font-bold text-white transition-colors disabled:cursor-not-allowed"
              style={{
                backgroundColor: loading ? "#CCCCCC" : "#1E5FD4",
                height: "48px",
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = "#1A4BA8";
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = "#1E5FD4";
              }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang tạo tài khoản...
                </span>
              ) : (
                "Đăng ký tài khoản người tìm việc"
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-semibold underline"
              style={{ color: "#1E5FD4" }}
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </section>

      {/* ═══ Hero Section (right) ══════════════════════════════ */}
      <section className="flex flex-col justify-start bg-white px-4 py-12 pt-20 lg:px-8 lg:py-16 lg:pt-20">
        <div className="mx-auto w-full max-w-[560px]">
          {/* Hero heading */}
          <h2
            className="font-bold leading-snug text-gray-900"
            style={{ fontSize: "20px" }}
          >
            Tạo tài khoản để nhận được{" "}
            <span style={{ color: "#1E5FD4" }}>nhiều lợi ích hấp dẫn</span>
          </h2>

          {/* Benefit cards */}
          <div className="mt-10 space-y-4">
            <BenefitCard
              bgColor="#E3F2FD"
              icon={
                <svg className="h-5 w-5" style={{ color: "#1E5FD4" }} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                </svg>
              }
              title="Tiếp cận cơ hội việc làm chất lượng"
              desc="Hàng ngàn việc làm IT từ các công ty uy tín đang chờ bạn ứng tuyển."
            />

            <BenefitCard
              bgColor="#ECFDF5"
              icon={
                <svg className="h-5 w-5 text-brand-green" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              }
              title="Tạo và quản lý hồ sơ chuyên nghiệp"
              desc="Xây dựng hồ sơ ấn tượng, nổi bật với nhà tuyển dụng để đăng ký."
            />

            <BenefitCard
              bgColor="#F3E8FF"
              icon={
                <svg className="h-5 w-5 text-brand-purple" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              }
              title="Nhận thông báo việc làm phù hợp"
              desc="Gợi ý việc làm phù hợp với kỹ năng và kinh nghiệm của bạn."
            />

            <BenefitCard
              bgColor="#FEF3C7"
              icon={
                <svg className="h-5 w-5 text-brand-orange" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              }
              title="Theo dõi và quản lý ứng tuyển để đăng"
              desc="Quản lý lịch sử ứng tuyển và theo dõi tiến trình một cách hiệu quả."
            />
          </div>

          {/* Security message */}
          <div className="mt-10 flex items-center gap-2 text-xs text-gray-400">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span>
              Thông tin của bạn được bảo mật tuyệt đối và chỉ sử dụng cho mục
              đích tuyển dụng.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
