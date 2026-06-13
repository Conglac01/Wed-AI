import { Button } from "@/shared/ui/Button";
import { SUPPORTED_FORMATS } from "../mock";

// ── Upload cloud icon ──────────────────────────────────────────────────────────

function UploadCloudIcon() {
  return (
    <svg
      className="h-14 w-14"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cloud body */}
      <ellipse cx="30" cy="34" rx="18" ry="10" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1.5" />
      <ellipse cx="38" cy="30" rx="12" ry="9" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1.5" />
      <ellipse cx="22" cy="33" rx="8" ry="6" fill="#F3F4F6" />
      {/* Arrow going up into tray */}
      <rect x="20" y="38" width="20" height="10" rx="3" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.2" />
      <path
        d="M30 18v16M24 24l6-6 6 6"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Format badge ───────────────────────────────────────────────────────────────

const FORMAT_COLORS: Record<string, { bg: string; text: string }> = {
  pdf: { bg: "#FEE2E2", text: "#DC2626" },
  word: { bg: "#DBEAFE", text: "#2563EB" },
  txt: { bg: "#F3F4F6", text: "#6B7280" },
  img: { bg: "#F3E8FF", text: "#7C3AED" },
};

function FormatBadge({ icon, extensions }: { icon: string; extensions: readonly string[] }) {
  const c = FORMAT_COLORS[icon] ?? FORMAT_COLORS.txt!;
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold leading-tight"
        style={{ backgroundColor: c.bg, color: c.text }}
      >
        {icon.toUpperCase()}
      </span>
      <span className="text-[11px] text-gray-400">
        {extensions.join(", ")}
      </span>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

interface CVUploadEmptyStateProps {
  onUploadClick: () => void;
}

export function CVUploadEmptyState({ onUploadClick }: CVUploadEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Upper content */}
      <div>
        {/* Title */}
        <h2 className="text-base font-bold text-gray-900 sm:text-lg">
          Chưa có CV nào được tải lên
        </h2>
        <p className="mt-1 text-[13px] text-gray-500 leading-relaxed">
          Hãy tải CV của bạn lên để AI phân tích và giúp bạn tìm việc làm phù hợp nhất.
        </p>

        {/* Upload zone */}
        <div
          className="mt-4 rounded-xl border-2 border-dashed px-6 py-7 flex flex-col items-center cursor-pointer transition-colors"
          style={{ borderColor: "#D1D5DB", backgroundColor: "#FAFBFC" }}
          onClick={onUploadClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onUploadClick();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#0047CC";
            e.currentTarget.style.backgroundColor = "#F0F5FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#D1D5DB";
            e.currentTarget.style.backgroundColor = "#FAFBFC";
          }}
        >
          <UploadCloudIcon />

          <p className="mt-3 text-[13px] text-gray-400 text-center">
            Kéo & thả file vào đây hoặc chọn file từ thiết bị của bạn
          </p>

          <Button onClick={onUploadClick} className="mt-4 px-5 text-sm">
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Tải CV lên
          </Button>
        </div>

        {/* Supported formats */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {SUPPORTED_FORMATS.map((f) => (
            <FormatBadge key={f.label} icon={f.icon} extensions={f.extensions} />
          ))}
        </div>
      </div>

      {/* Security notice — pinned bottom */}
      <div
        className="mt-5 flex items-center gap-2 rounded-lg px-3 py-2.5"
        style={{ backgroundColor: "#ECFDF5" }}
      >
        <svg
          className="h-4 w-4 shrink-0"
          style={{ color: "#10B981" }}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
        <span className="text-[12px] text-gray-500">
          Thông tin của bạn được bảo mật tuyệt đối và chỉ sử dụng để phân tích CV.
        </span>
      </div>
    </div>
  );
}
