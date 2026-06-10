import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

export function UserLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6">
          <Link
            to="/"
            className="text-base font-bold tracking-wide text-gray-900"
            style={{ fontSize: "16px" }}
          >
            VIECCONNECT IT JOBS
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            {isLoading ? (
              <span className="text-gray-400">...</span>
            ) : isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
                >
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

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} ViecConnect IT Jobs. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}
