import type { CVFile } from "../types";

function FileIcon() {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50">
      <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionLabel(name: string): string {
  return name.slice(name.lastIndexOf(".")).toUpperCase() || "UNKNOWN";
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

interface CVUploadingStateProps {
  file: CVFile;
  progress?: number;
  onCancel: () => void;
}

export function CVUploadingState({ file, progress = 0, onCancel: _onCancel }: CVUploadingStateProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* File card with progress */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "#BFDBFE", backgroundColor: "#F0F5FF" }}
      >
        <div className="flex items-start gap-3">
          <FileIcon />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
            <div className="mt-0.5 flex items-center gap-x-3 text-xs text-gray-500">
              <span>{extensionLabel(file.name)}</span>
              <span>{formatFileSize(file.size)}</span>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: "#0047CC" }}>
                  Đang tải CV lên...
                </span>
                <span className="text-xs font-semibold" style={{ color: "#0047CC" }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: "#0047CC" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel */}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled
          className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400"
        >
          Hủy tải lên
        </button>
      </div>

      {/* Skeleton extracted info section */}
      <div className="mt-4 rounded-lg border border-gray-100 bg-white p-4">
        <SkeletonBlock className="h-4 w-44 mb-4" />
        {/* Name/title skeleton */}
        <div className="rounded-lg bg-gray-50 px-3 py-3 space-y-1.5 mb-4">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-3.5 w-28" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
        {/* Contact rows */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="space-y-1">
            <SkeletonBlock className="h-2.5 w-10" />
            <SkeletonBlock className="h-3.5 w-32" />
          </div>
          <div className="space-y-1">
            <SkeletonBlock className="h-2.5 w-10" />
            <SkeletonBlock className="h-3.5 w-24" />
          </div>
          <div className="space-y-1">
            <SkeletonBlock className="h-2.5 w-14" />
            <SkeletonBlock className="h-3.5 w-40" />
          </div>
        </div>
        {/* Skills skeleton */}
        <SkeletonBlock className="h-2.5 w-14 mb-2" />
        <div className="flex gap-2 flex-wrap">
          <SkeletonBlock className="h-6 w-16 rounded-full" />
          <SkeletonBlock className="h-6 w-20 rounded-full" />
          <SkeletonBlock className="h-6 w-14 rounded-full" />
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-6 w-18 rounded-full" />
          <SkeletonBlock className="h-6 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
