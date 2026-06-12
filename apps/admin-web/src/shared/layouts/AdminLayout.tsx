import { Link, Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Placeholder sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-gray-50">
        <div className="px-6 py-4">
          <span className="text-lg font-bold text-primary-700">
            ViecConnect Admin
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-4 py-2">
          <a
            href="/"
            className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Bảng điều khiển
          </a>
          <span className="rounded-lg px-3 py-2 text-sm text-gray-400">
            Người dùng
          </span>
          <Link
            to="/jobs"
            className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Việc làm
          </Link>
          <span className="rounded-lg px-3 py-2 text-sm text-gray-400">
            Hạn ngạch
          </span>
          <span className="rounded-lg px-3 py-2 text-sm text-gray-400">
            AI Usage
          </span>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Placeholder admin header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-6 py-3">
            <span className="text-sm text-gray-500">
              Quản trị hệ thống
            </span>
            <a
              href="/login"
              className="text-sm text-gray-600 hover:text-primary-600"
            >
              Đăng nhập
            </a>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
