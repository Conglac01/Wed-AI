import { Button } from "@/shared/ui/Button";

interface CVInvalidFileStateProps {
  onRetry: () => void;
}

const REASONS = [
  "Định dạng không được hỗ trợ",
  "Dung lượng file quá lớn (tối đa 10MB)",
  "File không an toàn hoặc bị hỏng",
];

export function CVInvalidFileState({ onRetry }: CVInvalidFileStateProps) {
  return (
    <div>
      {/* Error alert */}
      <div className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900">File không hợp lệ</h3>
            <p className="mt-0.5 text-[12px] text-gray-500">Hệ thống không thể xử lý file bạn đã tải lên. Vui lòng kiểm tra lại.</p>
          </div>
        </div>
      </div>

      {/* Reasons */}
      <div className="mt-3 rounded-lg border border-gray-100 bg-white px-3 py-3">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Lý do có thể</p>
        <ul className="space-y-1.5">
          {REASONS.map((reason) => (
            <li key={reason} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
              <span className="text-[13px] text-gray-600">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action */}
      <div className="mt-4 flex justify-center">
        <Button onClick={onRetry} className="text-xs px-4 py-1.5">
          <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Chọn file khác
        </Button>
      </div>
    </div>
  );
}
