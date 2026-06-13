import { useState, useCallback, useEffect } from "react";
import type { UploadStatus } from "../types";
import { mockCVFile, mockCVPreview, mockExtractedInfo } from "../mock";
import { CVStepProgress } from "../components/CVStepProgress";
import { CVTipsSidebar } from "../components/CVTipsSidebar";
import { CVUploadEmptyState } from "../components/CVUploadEmptyState";
import { CVUploadingState } from "../components/CVUploadingState";
import { CVUploadSuccessState } from "../components/CVUploadSuccessState";
import { CVInvalidFileState } from "../components/CVInvalidFileState";
import { CVParseFailedState } from "../components/CVParseFailedState";
import { CVDebugPanel } from "../components/CVDebugPanel";

const MOCK_UPLOAD_DELAY = 1500;

export function CVAnalysisPage() {
  const [status, setStatus] = useState<UploadStatus>("empty");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status !== "uploading") return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 25 + 5;
        return next >= 100 ? 100 : next;
      });
    }, 300);
    const timer = setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setStatus("success"), 400);
    }, MOCK_UPLOAD_DELAY);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [status]);

  const handleUploadClick = useCallback(() => setStatus("uploading"), []);
  const handleCancelUpload = useCallback(() => { setStatus("empty"); setProgress(0); }, []);
  const handleDelete = useCallback(() => setStatus("empty"), []);
  const handleContinue = useCallback(() => {}, []);
  const handleRetry = useCallback(() => setStatus("empty"), []);
  const handleRetryUpload = useCallback(() => setStatus("uploading"), []);
  const handleManualAnalyze = useCallback(() => {}, []);

  function renderContent() {
    switch (status) {
      case "uploading":
        return <CVUploadingState file={mockCVFile} progress={progress} onCancel={handleCancelUpload} />;
      case "success":
        return <CVUploadSuccessState preview={mockCVPreview} extractedInfo={mockExtractedInfo} onDelete={handleDelete} onContinue={handleContinue} />;
      case "invalid":
        return <CVInvalidFileState onRetry={handleRetry} />;
      case "parse_failed":
        return <CVParseFailedState preview={mockCVPreview} onRetryUpload={handleRetryUpload} onManualAnalyze={handleManualAnalyze} />;
      default:
        return <CVUploadEmptyState onUploadClick={handleUploadClick} />;
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-gray-50/60">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Phân tích CV</h1>
          <p className="mt-1 text-sm text-gray-500">
            AI sẽ phân tích CV của bạn, gợi ý việc làm phù hợp và so sánh với mô tả công việc (JD).
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-7 lg:gap-5 h-full">
          {/* Left: stepper + content (5/7 ≈ 71%) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Stepper card */}
            <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
              <CVStepProgress status={status} />
            </div>

            {/* Content card — fills remaining space */}
            <div className="flex-1 rounded-lg border border-gray-100 bg-white px-5 py-5 shadow-sm flex flex-col">
              {renderContent()}
            </div>
          </div>

          {/* Right: sidebar (2/7 ≈ 29%) */}
          <div className="mt-4 lg:mt-0 lg:col-span-2">
            <CVTipsSidebar />
          </div>
        </div>
      </div>

      <CVDebugPanel currentStatus={status} onSetStatus={setStatus} />
    </div>
  );
}
