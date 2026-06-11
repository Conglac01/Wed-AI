import { useState, useRef, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

function DanhMucDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const items = [
    { label: "Phân tích CV", to: "/cv-analysis", desc: "AI đánh giá hồ sơ của bạn", icon: "📄" },
    { label: "Phỏng vấn AI", to: "/ai-interview", desc: "Luyện tập với AI Interview", icon: "🤖" },
    { label: "Việc làm", to: "/jobs", desc: "Khám phá cơ hội IT mới nhất", icon: "💼" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
      >
        Danh mục
        <svg className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function UserLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      {/* ═══════════════════════════════════════════════
          Header
          ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between pl-3 pr-4 sm:pl-3 sm:pr-6">
          {/* Logo — sát lề trái */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#0047CC" }}>WA</div>
            <span className="text-base font-bold tracking-tight text-gray-900">WEB-AI</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1 text-sm">
            <DanhMucDropdown />

            {isLoading ? (
              <span className="px-3 py-2 text-gray-400">...</span>
            ) : isAuthenticated && user ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  {user.full_name || user.email}
                </Link>
                <button onClick={() => logout()} className="rounded-lg border px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50" style={{ borderColor: "#EBEBEB" }}>Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg border px-4 py-2 font-medium transition-colors hover:bg-gray-50" style={{ borderColor: "#0047CC", color: "#0047CC" }}>Đăng nhập</Link>
                <Link to="/register" className="rounded-lg px-4 py-2 font-medium text-white transition-colors hover:opacity-90" style={{ backgroundColor: "#0047CC" }}>Đăng ký</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1"><Outlet /></main>

      {/* ═══════════════════════════════════════════════
          Footer
          ═══════════════════════════════════════════════ */}
      <footer className="text-gray-300" style={{ backgroundColor: "#0D1B3E" }}>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#0047CC" }}>WA</div>
                <span className="text-lg font-bold text-white">WEB-AI</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">Nền tảng việc làm IT tích hợp AI — kết nối nhân tài công nghệ với cơ hội việc làm tốt nhất.</p>
              <div className="mt-4 flex gap-3">
                {["facebook", "linkedin", "github"].map((p) => (
                  <a key={p} href="#" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} aria-label={p}>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10z" /></svg>
                  </a>
                ))}
              </div>
            </div>
            <div><h4 className="text-sm font-semibold text-white">Dành cho ứng viên</h4><ul className="mt-4 space-y-2.5 text-sm">{["Việc làm IT","CV của tôi","Phân tích CV","AI Interview","Gợi ý việc làm"].map((i)=><li key={i}><a href="#" className="text-gray-400 hover:text-white transition-colors">{i}</a></li>)}</ul></div>
            <div><h4 className="text-sm font-semibold text-white">Dành cho nhà tuyển dụng</h4><ul className="mt-4 space-y-2.5 text-sm">{["Đăng tin tuyển dụng","Tìm kiếm hồ sơ","Quản lý tin đăng","Báo cáo & Thống kê","Gói dịch vụ"].map((i)=><li key={i}><a href="#" className="text-gray-400 hover:text-white transition-colors">{i}</a></li>)}</ul></div>
            <div><h4 className="text-sm font-semibold text-white">Về chúng tôi</h4><ul className="mt-4 space-y-2.5 text-sm">{["Giới thiệu","Đội ngũ","Blog","Điều khoản sử dụng","Chính sách bảo mật"].map((i)=><li key={i}><a href="#" className="text-gray-400 hover:text-white transition-colors">{i}</a></li>)}</ul></div>
            <div>
              <h4 className="text-sm font-semibold text-white">Liên hệ</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li className="flex items-start gap-2 text-gray-400"><svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>contact@web-ai.vn</li>
                <li className="flex items-start gap-2 text-gray-400"><svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>(+84) 28 9999 8888</li>
                <li className="flex items-start gap-2 text-gray-400"><svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>TP. Hồ Chí Minh, Việt Nam</li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} WEB-AI. Tất cả quyền được bảo lưu.</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                Bảo mật bởi SSL
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
