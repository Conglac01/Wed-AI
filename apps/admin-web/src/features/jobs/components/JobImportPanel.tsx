import { isImportEndpointAvailable } from "../services/adminJobsService";

// ── Placeholder panel (backend CSV import endpoint not available) ────────────

function PlaceholderPanel() {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <h4 className="mt-4 text-sm font-semibold text-gray-700">Import CSV</h4>
      <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
        Chức năng import CSV sẽ được kết nối khi backend endpoint sẵn sàng.
      </p>
      <p className="mt-3 text-[10px] text-gray-400">
        Endpoint dự kiến: <code className="rounded bg-gray-100 px-1 py-0.5">POST /api/v1/jobs/import</code>
      </p>
    </div>
  );
}

// ── Live panel (future — when backend endpoint exists) ───────────────────────

function LivePanel() {
  // TODO: connect to real CSV upload endpoint when available
  return <PlaceholderPanel />;
}

// ── Public component ─────────────────────────────────────────────────────────

export function JobImportPanel() {
  const available = isImportEndpointAvailable();

  if (!available) {
    return <PlaceholderPanel />;
  }

  return <LivePanel />;
}
