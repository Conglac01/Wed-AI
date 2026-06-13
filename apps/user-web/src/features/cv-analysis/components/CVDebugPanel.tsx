import type { UploadStatus } from "../types";

// ── Props ──────────────────────────────────────────────────────────────────────

interface CVDebugPanelProps {
  currentStatus: UploadStatus;
  onSetStatus: (status: UploadStatus) => void;
}

// ── Statuses ───────────────────────────────────────────────────────────────────

const STATUSES: { value: UploadStatus; label: string }[] = [
  { value: "empty", label: "Empty" },
  { value: "uploading", label: "Uploading" },
  { value: "success", label: "Success" },
  { value: "invalid", label: "Invalid" },
  { value: "parse_failed", label: "Parse Failed" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function CVDebugPanel({ currentStatus, onSetStatus }: CVDebugPanelProps) {
  const isDev = import.meta.env.DEV;
  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-gray-300 bg-white/95 shadow-xl backdrop-blur-sm p-3 max-w-[200px]">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Debug — State Switcher
      </p>
      <div className="space-y-1">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onSetStatus(s.value)}
            className={`w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
              currentStatus === s.value
                ? "bg-[#0047CC] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
