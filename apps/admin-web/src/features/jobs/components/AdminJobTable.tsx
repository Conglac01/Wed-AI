import type { AdminJob } from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function qualityBadge(score: number | null) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        Chưa có
      </span>
    );
  }

  const pct = Math.round(score * 100) / 100; // safety round

  if (pct >= 70) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
        {pct}
      </span>
    );
  }

  if (pct >= 40) {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
        {pct}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
      {pct}
    </span>
  );
}

function statusBadge(active: boolean) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      Đang hiển thị
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
      Ẩn
    </span>
  );
}

function safeSkills(skills: unknown): string {
  if (!Array.isArray(skills) || skills.length === 0) return "—";
  return skills.slice(0, 3).join(", ") + (skills.length > 3 ? ` +${skills.length - 3}` : "");
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ── Table states ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <svg className="h-14 w-14 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
      <h3 className="mt-4 text-sm font-semibold text-gray-700">Không có việc làm nào</h3>
      <p className="mt-1 text-xs text-gray-500">Thử thay đổi bộ lọc hoặc nhập dữ liệu mới.</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <svg className="h-14 w-14 text-red-200" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <h3 className="mt-4 text-sm font-semibold text-gray-700">Lỗi tải dữ liệu</h3>
      <p className="mt-1 text-xs text-gray-500 max-w-md">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
      >
        Thử lại
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-lg bg-gray-50 px-4 py-3">
          <div className="h-4 w-2/5 rounded bg-gray-200" />
          <div className="h-4 w-1/5 rounded bg-gray-200" />
          <div className="h-4 w-1/6 rounded bg-gray-200" />
          <div className="h-4 w-1/6 rounded bg-gray-200" />
          <div className="h-4 w-1/6 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

// ── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-gray-500">
        Trang {page} / {totalPages} ({total} việc làm)
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30"
        >
          ← Trước
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              p === page ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface AdminJobTableProps {
  jobs: AdminJob[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
  onRetry: () => void;
}

export function AdminJobTable({
  jobs,
  total,
  loading,
  error,
  page,
  limit,
  onPageChange,
  onRetry,
}: AdminJobTableProps) {
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (jobs.length === 0) return <EmptyState />;

  return (
    <div>
      {/* Scrollable wrapper for smaller screens */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Tên việc làm</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Công ty</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Địa điểm</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Kỹ năng</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Nguồn</th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-gray-700">Điểm CL</th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-gray-700">Trạng thái</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="max-w-[240px] truncate px-4 py-3 font-medium text-gray-900" title={job.title}>
                  {job.title}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{job.company_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">{job.location || "—"}</td>
                <td className="max-w-[180px] truncate px-4 py-3 text-gray-600" title={safeSkills(job.skills)}>
                  {safeSkills(job.skills)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {job.source_name || "Không rõ"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center">{qualityBadge(job.quality_score)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-center">{statusBadge(job.is_active)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatDate(job.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} limit={limit} onPageChange={onPageChange} />
    </div>
  );
}
