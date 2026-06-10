import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

/**
 * Auth layout — shared by Login and Register pages.
 *
 * Desktop: global header + two-column (form left 40% + hero right 60%)
 * Tablet:  stacked (form top, hero below)
 * Mobile:  single column
 */
export function AuthLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Global Header ────────────────────────────────────── */}
      <header
        className="flex h-16 items-center border-b bg-white"
        style={{ borderColor: "#EBEBEB" }}
      >
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-bold tracking-wide text-gray-900"
            style={{ fontSize: "14px" }}
          >
            {/* Gear / cog icon */}
            <svg className="h-6 w-6 flex-shrink-0" style={{ color: "#1E5FD4" }} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.637l1.296 2.247a1.125 1.125 0 01-.29 1.484l-.94.703c-.28.21-.418.592-.344.96.022.108.03.22.03.333 0 .113-.008.225-.03.333-.074.368.064.75.344.96l.94.703a1.125 1.125 0 01.29 1.484l-1.296 2.247a1.125 1.125 0 01-1.37.637l-1.217-.456c-.355-.133-.751-.072-1.075.124-.073.044-.146.087-.22.127-.332.184-.582.496-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94H10.5c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a2.56 2.56 0 00-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.637l-1.296-2.247a1.125 1.125 0 01.29-1.484l.94-.703c.28-.21.418-.592.344-.96a2.368 2.368 0 01-.03-.333c0-.113.008-.225.03-.333.074-.368-.064-.75-.344-.96l-.94-.703a1.125 1.125 0 01-.29-1.484l1.296-2.247a1.125 1.125 0 011.37-.637l1.217.456c.355.133.751.072 1.075-.124.074-.044.147-.083.22-.127.332-.184.582-.496.645-.87l.213-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            VIECCONNECT IT JOBS
          </Link>

          {/* Right nav */}
          <nav className="flex items-center gap-3 text-sm">
            {isLoading ? (
              <span className="text-gray-400">...</span>
            ) : isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
                >
                  {/* User icon */}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {user.full_name || user.email}
                </Link>
                <button
                  onClick={() => logout()}
                  className="rounded-lg border px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#EBEBEB" }}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border px-5 py-2 font-medium transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#1E5FD4", color: "#1E5FD4" }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg px-5 py-2 font-medium text-white transition-colors"
                  style={{ backgroundColor: "#1E5FD4" }}
                >
                  Đăng ký
                </Link>
                {/* User icon circle — top-right */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#F8F9FB" }}
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Page Content (form + hero) ────────────────────────── */}
      <Outlet />
    </div>
  );
}
