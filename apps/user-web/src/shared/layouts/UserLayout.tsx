import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

// ── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Trang chủ", to: "/", icon: "🏠", protected: false },
  { label: "Việc làm", to: "/jobs", icon: "💼", protected: false },
  { label: "Phân tích CV", to: "/cv-analysis", icon: "📄", protected: true },
  { label: "Phỏng vấn với AI", to: "/interview", icon: "🤖", protected: true },
  { label: "Lịch sử phỏng vấn", to: "/interview-history", icon: "📋", protected: true },
  { label: "Cài đặt", to: "/settings", icon: "⚙️", protected: true },
] as const;

type NavItem = (typeof NAV_ITEMS)[number];

// ── Active link helper ───────────────────────────────────────────────────────

function useIsActive(to: string): boolean {
  const loc = useLocation();
  if (to === "/") return loc.pathname === "/";
  return loc.pathname.startsWith(to);
}

// ── Lock icon SVG ────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

// ── Desktop nav link (auth-aware) ────────────────────────────────────────────

function NavLink({ item }: { item: NavItem }) {
  const active = useIsActive(item.to);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Guest clicking a protected link → redirect to login
  const isProtected = item.protected && !isAuthenticated;
  const to = isProtected ? `/login?redirect=${encodeURIComponent(item.to)}` : item.to;

  function handleClick(e: React.MouseEvent) {
    if (isProtected) {
      e.preventDefault();
      navigate(to);
    }
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active && !isProtected
          ? "bg-blue-50 text-[#0047CC]"
          : isProtected
            ? "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      <span className="text-base">{item.icon}</span>
      <span>{item.label}</span>
      {isProtected && <LockIcon />}
    </Link>
  );
}

// ── Mobile nav link (auth-aware) ─────────────────────────────────────────────

function MobileNavLink({ item, onClick }: { item: NavItem; onClick: () => void }) {
  const active = useIsActive(item.to);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isProtected = item.protected && !isAuthenticated;
  const to = isProtected ? `/login?redirect=${encodeURIComponent(item.to)}` : item.to;

  function handleClick(e: React.MouseEvent) {
    onClick();
    if (isProtected) {
      e.preventDefault();
      navigate(to);
    }
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
        active && !isProtected
          ? "bg-blue-50 text-[#0047CC] font-semibold"
          : isProtected
            ? "text-gray-400 hover:bg-gray-50"
            : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="text-lg">{item.icon}</span>
      <span className="text-sm">{item.label}</span>
      {isProtected && <LockIcon />}
    </Link>
  );
}

// ── User dropdown (desktop) ──────────────────────────────────────────────────

function UserMenu({
  user,
  onLogout,
}: {
  user: { full_name: string | null; email: string };
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0047CC] text-xs font-bold text-white">
          {(user.full_name || user.email).charAt(0).toUpperCase()}
        </div>
        <span className="hidden lg:inline max-w-[120px] truncate">
          {user.full_name || user.email}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.full_name || "Người dùng"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Trang cá nhân
            </Link>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.637l1.296 2.247a1.125 1.125 0 01-.29 1.484l-.94.703c-.28.21-.418.592-.344.96.022.108.03.22.03.333 0 .113-.008.225-.03.333-.074.368.064.75.344.96l.94.703a1.125 1.125 0 01.29 1.484l-1.296 2.247a1.125 1.125 0 01-1.37.637l-1.217-.456c-.355-.133-.751-.072-1.075.124-.073.044-.146.087-.22.127-.332.184-.582.496-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94H10.5c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a2.56 2.56 0 00-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.637l-1.296-2.247a1.125 1.125 0 01.29-1.484l.94-.703c.28-.21.418-.592.344-.96a2.368 2.368 0 01-.03-.333c0-.113.008-.225.03-.333.074-.368-.064-.75-.344-.96l-.94-.703a1.125 1.125 0 01-.29-1.484l1.296-2.247a1.125 1.125 0 011.37-.637l1.217.456c.355.133.751.072 1.075-.124.074-.044.147-.083.22-.127.332-.184.582-.496.645-.87l.213-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Cài đặt
            </Link>
          </div>
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main layout ──────────────────────────────────────────────────────────────

export function UserLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node))
        setMobileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* ═══════════════════════════════════════════════════
          Header
          ═══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between pl-3 pr-4 sm:pl-3 sm:pr-6">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white sm:h-9 sm:w-9 sm:text-sm"
              style={{ backgroundColor: "#0047CC" }}
            >
              WA
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900 sm:text-base">
              WEB-AI
            </span>
          </Link>

          {/* ── Desktop nav ─────────────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-0.5 text-sm">
            {isLoading ? (
              <span className="px-3 py-2 text-gray-400">...</span>
            ) : (
              <>
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.to} item={item} />
                ))}

                <div className="ml-2 pl-2 border-l border-gray-200">
                  {isAuthenticated && user ? (
                    <UserMenu user={user} onLogout={handleLogout} />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/login"
                        className="rounded-lg border px-4 py-2 font-medium transition-colors hover:bg-gray-50"
                        style={{ borderColor: "#0047CC", color: "#0047CC" }}
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        to="/register"
                        className="rounded-lg px-4 py-2 font-medium text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: "#0047CC" }}
                      >
                        Đăng ký
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* ── Mobile hamburger ────────────────────────────────── */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-center rounded-lg p-2 text-gray-600 lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Mobile menu ───────────────────────────────────────── */}
        {mobileOpen && (
          <div ref={mobileRef} className="border-t border-gray-100 bg-white lg:hidden">
            <div className="px-4 py-3 space-y-1">
              {isAuthenticated && user ? (
                <>
                  {/* User info header */}
                  <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-100 mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0047CC] text-sm font-bold text-white">
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.full_name || "Người dùng"}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  {NAV_ITEMS.map((item) => (
                    <MobileNavLink key={item.to} item={item} onClick={closeMobile} />
                  ))}
                  <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
                    <Link
                      to="/profile"
                      onClick={closeMobile}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span className="text-sm font-medium">Trang cá nhân</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        closeMobile();
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                      <span className="text-sm font-medium">Đăng xuất</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {NAV_ITEMS.map((item) => (
                    <MobileNavLink key={item.to} item={item} onClick={closeMobile} />
                  ))}
                  <div className="border-t border-gray-100 mt-3 pt-3 space-y-2">
                    <div className="flex gap-2">
                      <Link
                        to="/login"
                        onClick={closeMobile}
                        className="flex-1 rounded-lg border px-4 py-3 text-center text-sm font-medium"
                        style={{ borderColor: "#0047CC", color: "#0047CC" }}
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        to="/register"
                        onClick={closeMobile}
                        className="flex-1 rounded-lg px-4 py-3 text-center text-sm font-medium text-white"
                        style={{ backgroundColor: "#0047CC" }}
                      >
                        Đăng ký
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ═══════════════════════════════════════════════════
          Footer
          ═══════════════════════════════════════════════════ */}
      <footer className="text-gray-300" style={{ backgroundColor: "#0D1B3E" }}>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
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
            <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
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
