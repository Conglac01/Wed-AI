import type { CVPreview } from "../types";
import { Button } from "@/shared/ui/Button";
import { CVFileCard } from "./CVFileCard";

interface CVParseFailedStateProps {
  preview: CVPreview;
  onRetryUpload: () => void;
  onManualAnalyze: () => void;
}

export function CVParseFailedState({
  preview,
  onRetryUpload,
  onManualAnalyze,
}: CVParseFailedStateProps) {
  return (
    <div>
      {/* Warning alert */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900">Không đọc được nội dung CV</h3>
            <p className="mt-0.5 text-[12px] text-gray-500">
              File đã được tải lên nhưng hệ thống chưa thể trích xuất nội dung. Có thể file bị mờ, scan chất lượng thấp, hoặc định dạng không chuẩn.
            </p>
          </div>
        </div>
      </div>

      {/* File card */}
      <CVFileCard preview={preview} showViewButton={false} className="mt-3" />

      {/* Actions */}
      <div className="mt-4 flex gap-3 justify-center flex-wrap">
        <Button onClick={onRetryUpload} className="text-xs px-4 py-1.5">
          <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Tải lại CV
        </Button>
        <Button variant="secondary" onClick={onManualAnalyze} className="text-xs px-4 py-1.5">
          <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Thử phân tích thủ công
        </Button>
      </div>
    </div>
  );
}
