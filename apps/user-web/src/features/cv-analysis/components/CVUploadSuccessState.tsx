import type { CVPreview, CVExtractedInfo } from "../types";
import { Button } from "@/shared/ui/Button";
import { CVFileCard } from "./CVFileCard";
import { CVExtractedInfoPreview } from "./CVExtractedInfoPreview";

interface CVUploadSuccessStateProps {
  preview: CVPreview;
  extractedInfo: CVExtractedInfo;
  onDelete: () => void;
  onContinue: () => void;
}

export function CVUploadSuccessState({
  preview,
  extractedInfo,
  onDelete,
  onContinue,
}: CVUploadSuccessStateProps) {
  return (
    <div>
      {/* Success alert */}
      <div className="rounded-lg border border-green-200 bg-green-50/60 px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10B981]">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900">CV của bạn đã được tải lên thành công!</h3>
            <p className="mt-0.5 text-[12px] text-gray-500">AI sẽ phân tích nội dung và trích xuất thông tin quan trọng từ CV của bạn.</p>
          </div>
        </div>
      </div>

      {/* File card */}
      <CVFileCard preview={preview} onView={() => {}} className="mt-3" />

      {/* Extracted info */}
      <CVExtractedInfoPreview info={extractedInfo} className="mt-3" />

      {/* Action buttons */}
      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <Button variant="secondary" onClick={onDelete} className="text-xs px-3 py-1.5">
          <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          Xóa và tải lại
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">Sang bước 2</span>
          <Button onClick={onContinue} className="text-xs px-3 py-1.5">
            <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Tiếp tục phân tích
          </Button>
        </div>
      </div>

      {/* Next step */}
      <div className="mt-3 rounded-lg border px-3 py-2.5" style={{ borderColor: "#BFDBFE", backgroundColor: "#F0F5FF" }}>
        <div className="flex items-start gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-100" style={{ color: "#0047CC" }}>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-gray-900">Bước tiếp theo</h4>
            <p className="mt-0.5 text-[12px] text-gray-500">AI sẽ tiếp tục phân tích CV của bạn để đánh giá chất lượng hồ sơ và đề xuất việc làm phù hợp.</p>
            <Button onClick={onContinue} className="mt-2 text-xs px-3 py-1.5">Tiếp tục phân tích</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
