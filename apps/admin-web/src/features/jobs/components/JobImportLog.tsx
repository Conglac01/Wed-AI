// ── Placeholder — backend does not have import log endpoint yet ──────────────

export function JobImportLog() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-bold text-gray-900">Lịch sử import</h3>
      <p className="mt-1 text-xs text-gray-500">
        Dữ liệu import log sẽ hiển thị khi backend endpoint sẵn sàng.
      </p>

      {/* Safe placeholder — no fake data */}
      <div className="mt-6 flex flex-col items-center py-10 text-center">
        <svg className="h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-gray-500">Chưa có dữ liệu import</p>
        <p className="mt-1 text-xs text-gray-400">
          Kết nối với <code className="rounded bg-gray-100 px-1 py-0.5">GET /api/v1/jobs/import/log</code> trong tương lai.
        </p>
      </div>
    </div>
  );
}
