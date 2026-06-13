import type { UploadStatus } from "../types";

interface Step {
  number: number;
  title: string;
  subtitle: string;
}

const STEPS: Step[] = [
  { number: 1, title: "Upload CV", subtitle: "Tải CV của bạn lên" },
  { number: 2, title: "AI Phân tích CV", subtitle: "Phân tích tổng quát" },
  { number: 3, title: "Gợi ý việc làm", subtitle: "Đề xuất phù hợp" },
  { number: 4, title: "CV vs JD Analysis", subtitle: "So sánh & đánh giá" },
];

function activeStep(status: UploadStatus): number {
  switch (status) {
    case "empty":
    case "uploading":
    case "invalid":
      return 1;
    case "success":
    case "parse_failed":
      return 2;
    default:
      return 1;
  }
}

function StepDot({
  step,
  isActive,
  isCompleted,
}: {
  step: number;
  isActive: boolean;
  isCompleted: boolean;
}) {
  if (isCompleted) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#10B981]">
        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    );
  }

  if (isActive) {
    return (
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: "#0047CC" }}
      >
        {step}
      </div>
    );
  }

  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-xs font-medium text-gray-350" style={{ color: "#B0B7C3" }}>
      {step}
    </div>
  );
}

function Connector({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div className="flex-1 mx-1 sm:mx-2" style={{ height: 1.5 }}>
      <div
        className="h-full rounded-full"
        style={{ backgroundColor: isCompleted ? "#10B981" : "#E5E7EB" }}
      />
    </div>
  );
}

interface CVStepProgressProps {
  status: UploadStatus;
}

export function CVStepProgress({ status }: CVStepProgressProps) {
  const current = activeStep(status);

  return (
    <div>
      {/* Step indicators row */}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const isActive = s.number === current;
          const isCompleted = s.number < current;

          return (
            <div key={s.number} className="flex items-center flex-1 last:flex-none">
              {/* Dot + label */}
              <div className="flex flex-col items-center gap-1">
                <StepDot step={s.number} isActive={isActive} isCompleted={isCompleted} />
                <span
                  className="text-[10px] sm:text-[11px] font-semibold whitespace-nowrap leading-tight"
                  style={{
                    color: isActive ? "#0047CC" : isCompleted ? "#10B981" : "#B0B7C3",
                  }}
                >
                  {s.title}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <Connector isCompleted={s.number < current} />
              )}
            </div>
          );
        })}
      </div>

      {/* Active step subtitle */}
      <p className="mt-2 text-center text-xs text-gray-400">
        {STEPS[current - 1]?.subtitle}
      </p>
    </div>
  );
}
