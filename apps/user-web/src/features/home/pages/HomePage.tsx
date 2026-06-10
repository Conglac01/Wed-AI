import { useHealthStatus } from "@/shared/hooks/useHealthStatus";

export function HomePage() {
  const { status, loading } = useHealthStatus();

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-primary-700">
        ViecConnect IT Jobs
      </h1>
      <p className="max-w-xl text-lg text-gray-600">
        Nền tảng việc làm IT tích hợp AI
      </p>

      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
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
