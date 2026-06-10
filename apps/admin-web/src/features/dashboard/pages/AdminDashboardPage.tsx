import { useHealthStatus } from "@/shared/hooks/useHealthStatus";

export function AdminDashboardPage() {
  const { status, loading } = useHealthStatus();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          ViecConnect Admin
        </h1>
        <p className="mt-1 text-gray-600">
          Bảng điều khiển quản trị hệ thống
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Backend:</span>
        {loading ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
            Đang kiểm tra...
          </span>
        ) : status === "healthy" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 font-medium text-green-700">
            &#x2022; Hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 font-medium text-red-700">
            &#x2022; Không khả dụng
          </span>
        )}
      </div>
    </div>
  );
}
