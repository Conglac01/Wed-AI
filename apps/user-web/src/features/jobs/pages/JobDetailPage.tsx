import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useJobDetail } from "../hooks/useJobDetail";
import { JobSkillTags } from "../components/JobSkillTags";

// ── Skeleton ────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-6 px-4 py-10">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-5 w-72 rounded bg-gray-200" />
          <div className="h-4 w-48 rounded bg-gray-200" />
        </div>
      </div>
      <div className="h-40 rounded-xl bg-gray-200" />
      <div className="h-32 rounded-xl bg-gray-200" />
    </div>
  );
}

// ── 404 ─────────────────────────────────────────────────────────────────────

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <svg className="h-20 w-20 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <h2 className="mt-5 text-xl font-bold text-gray-700">Không tìm thấy công việc</h2>
      <p className="mt-2 text-sm text-gray-500">Công việc này có thể đã hết hạn hoặc không tồn tại</p>
      <button
        onClick={() => navigate("/jobs")}
        className="mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: "#0047CC" }}
      >
        Quay lại danh sách
      </button>
    </div>
  );
}

// ── Error ───────────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <svg className="h-16 w-16 text-red-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <h2 className="mt-4 text-lg font-semibold text-gray-700">Đã xảy ra lỗi khi tải dữ liệu</h2>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      <button
        onClick={() => navigate("/jobs")}
        className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: "#0047CC" }}
      >
        Quay lại
      </button>
    </div>
  );
}

// ── Section card ────────────────────────────────────────────────────────────

function ContentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <h3 className="mb-4 text-lg font-bold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function DetailLogo({
  logoUrl,
  companyName,
}: {
  logoUrl: string | null;
  companyName: string;
}) {
  const [error, setError] = useState(false);

  if (!logoUrl || error) {
    return (
      <span className="text-sm font-bold text-gray-400">
        {companyName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w![0])
          .join("")
          .toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={companyName}
      className="h-full w-full object-contain p-1"
      onError={() => setError(true)}
    />
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const jobId = Number(id);

  if (!id || Number.isNaN(jobId)) {
    return <NotFound />;
  }

  return <JobDetailContent jobId={jobId} navigate={navigate} />;
}

function JobDetailContent({
  jobId,
  navigate,
}: {
  jobId: number;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { job, loading, error, notFound } = useJobDetail(jobId);

  if (loading) return <DetailSkeleton />;
  if (notFound) return <NotFound />;
  if (error) return <ErrorState message={error} />;
  if (!job) return <NotFound />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header section ──────────────────────────── */}
      <div className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {/* Logo */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
            <DetailLogo
              logoUrl={job.company_logo_url}
              companyName={job.company_name}
            />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{job.title}</h1>
            <p className="mt-1 text-base font-medium text-gray-700">{job.company_name}</p>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {job.location}
                </span>
              )}
              {job.salary_text && (
                <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "#E85D04" }}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {job.salary_text}
                </span>
              )}
              {job.deadline && (
                <span className="inline-flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Hạn: {job.deadline}
                </span>
              )}
              {job.source_name && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: job.source_name === "CareerLink" ? "#0047CC" : "#6B7280" }}
                >
                  {job.source_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action buttons ──────────────────────────── */}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={() => navigate("/jobs")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Quay lại
        </button>
        <button
          disabled
          className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium opacity-60 cursor-not-allowed"
          style={{ backgroundColor: "#E8F1FD", color: "#0047CC" }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          Phân tích CV
        </button>
        <button
          disabled
          className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Ứng tuyển
        </button>
      </div>

      {/* ── Content sections ─────────────────────────── */}
      <div className="mt-6 space-y-4">
        <ContentCard title="📋 Mô tả công việc">
          <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-700">{job.description}</div>
        </ContentCard>

        {job.requirements && (
          <ContentCard title="✅ Yêu cầu">
            <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-700">{job.requirements}</div>
          </ContentCard>
        )}

        {job.benefits && (
          <ContentCard title="🎁 Quyền lợi">
            <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-700">{job.benefits}</div>
          </ContentCard>
        )}

        {job.skills && job.skills.length > 0 && (
          <ContentCard title="💡 Kỹ năng">
            <JobSkillTags skills={job.skills} max={20} />
          </ContentCard>
        )}
      </div>
    </div>
  );
}
