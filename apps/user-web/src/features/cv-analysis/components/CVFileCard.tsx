import type { CVPreview } from "../types";
import { Button } from "@/shared/ui/Button";

function FileIcon() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
      <svg className="h-4.5 w-4.5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </div>
  );
}

function FileTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-50 text-red-600">
      {type}
    </span>
  );
}

interface CVFileCardProps {
  preview: CVPreview;
  onView?: () => void;
  showViewButton?: boolean;
  className?: string;
}

export function CVFileCard({
  preview,
  onView,
  showViewButton = true,
  className = "",
}: CVFileCardProps) {
  return (
    <div className={`flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-3 gap-3 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <FileIcon />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{preview.fileName}</p>
            <FileTypeBadge type={preview.fileType} />
          </div>
          <div className="mt-0.5 flex items-center gap-x-2 text-[11px] text-gray-400">
            <span>{preview.fileSize}</span>
            <span>•</span>
            <span>{preview.uploadTime}</span>
          </div>
        </div>
      </div>
      {showViewButton && onView && (
        <Button variant="secondary" onClick={onView} className="shrink-0 text-xs px-3 py-1.5">
          <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Xem CV
        </Button>
      )}
    </div>
  );
}
