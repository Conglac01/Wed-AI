import { useAdminJobs } from "../hooks/useAdminJobs";
import { AdminJobTable } from "../components/AdminJobTable";
import { JobImportPanel } from "../components/JobImportPanel";
import { JobImportLog } from "../components/JobImportLog";
import type { AdminJobFilters } from "../types";
import { DEFAULT_FILTERS } from "../types";

// ── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  filters,
  updateFilter,
  onClear,
}: {
  filters: AdminJobFilters;
  updateFilter: <K extends keyof AdminJobFilters>(key: K, value: AdminJobFilters[K]) => void;
  onClear: () => void;
}) {
  const hasFilters =
    filters.keyword !== "" ||
    filters.status !== "all" ||
    filters.source !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Keyword search */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-gray-600 mb-1">Tìm kiếm</label>
        <input
          type="text"
          value={filters.keyword}
          onChange={(e) => updateFilter("keyword", e.target.value)}
          placeholder="Tên việc làm, công ty..."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Status dropdown */}
      <div className="min-w-[140px]">
        <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
        <select
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value as AdminJobFilters["status"])}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Tất cả</option>
          <option value="active">Đang hiển thị</option>
          <option value="inactive">Ẩn</option>
        </select>
      </div>

      {/* Source filter */}
      <div className="min-w-[150px]">
        <label className="block text-xs font-medium text-gray-600 mb-1">Nguồn</label>
        <input
          type="text"
          value={filters.source}
          onChange={(e) => updateFilter("source", e.target.value)}
          placeholder="VD: CareerLink, CSV..."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Date range */}
      <div className="min-w-[130px]">
        <label className="block text-xs font-medium text-gray-600 mb-1">Từ ngày</label>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => updateFilter("dateFrom", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="min-w-[130px]">
        <label className="block text-xs font-medium text-gray-600 mb-1">Đến ngày</label>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => updateFilter("dateTo", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={onClear}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Xoá lọc
        </button>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminJobsPage() {
  const { jobs, total, loading, error, page, limit, filters, setPage, updateFilter, setFilters, refetch } =
    useAdminJobs();

  const handleClear = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quản lý việc làm</h1>
        <p className="mt-1 text-sm text-gray-600">
          Xem và quản lý tất cả việc làm IT trong hệ thống. Dữ liệu được đồng bộ từ các nguồn CareerLink, CSV, và mock.
        </p>
      </div>

      {/* Import panel */}
      <JobImportPanel />

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <FilterBar filters={filters} updateFilter={updateFilter} onClear={handleClear} />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Danh sách việc làm
            {!loading && !error && (
              <span className="ml-2 text-sm font-normal text-gray-500">({total})</span>
            )}
          </h2>
        </div>

        <AdminJobTable
          jobs={jobs}
          total={total}
          loading={loading}
          error={error}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onRetry={refetch}
        />
      </div>

      {/* Import log (placeholder) */}
      <JobImportLog />
    </div>
  );
}
