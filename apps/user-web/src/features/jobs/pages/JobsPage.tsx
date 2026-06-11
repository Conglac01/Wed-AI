import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useJobs } from "../hooks/useJobs";
import { getJobs } from "../services/jobsService";
import { JobCard } from "../components/JobCard";
import { JobFilters } from "../components/JobFilters";
import type { JobListItem } from "../types";

/** Inline SVG — quiet gray building icon, used as img fallback. */
const COMPANY_PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#F3F4F6"/><path d="M20 44V28l12-8 12 8v16H32v-8h-4v8H20z" fill="#9CA3AF"/><rect x="28" y="20" width="8" height="4" rx="1" fill="#D1D5DB"/></svg>'
);

// ── Skeleton ────────────────────────────────────────────────────────────────

function JobCardSkeleton() {
  return (
    <div className="flex animate-pulse gap-4 rounded-2xl border border-gray-100 bg-white p-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div className="h-16 w-16 shrink-0 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3.5 w-1/2 rounded bg-gray-200" />
        <div className="h-3 w-1/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}

// ── Top Companies ───────────────────────────────────────────────────────────

interface CompanyGroup { name: string; logo: string | null; count: number; }

function companyInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]!).join("").toUpperCase();
}

function TopCompanies({ jobs }: { jobs: JobListItem[] }) {
  const companies = useMemo(() => {
    const map = new Map<string, { logo: string | null; count: number }>();
    for (const job of jobs) { const e = map.get(job.company_name); if (e) e.count++; else map.set(job.company_name, { logo: job.company_logo_url, count: 1 }); }
    const r: CompanyGroup[] = []; for (const [n, d] of map) r.push({ name: n, logo: d.logo, count: d.count });
    r.sort((a, b) => b.count - a.count); return r.slice(0, 8);
  }, [jobs]);
  if (companies.length < 4) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900">Công Ty Công Nghệ</h2>
      <p className="mt-1 text-sm text-gray-500">Những công ty hàng đầu đang tuyển dụng IT</p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {companies.map((c) => (
          <div key={c.name} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
              {c.logo ? (
                <img
                  src={c.logo}
                  alt={c.name}
                  className="h-full w-full object-contain p-1"
                  onError={(e) => {
                    e.currentTarget.src = COMPANY_PLACEHOLDER;
                    e.currentTarget.onerror = null;
                  }}
                />
              ) : (
                <span className="text-xs font-bold text-gray-400">{companyInitials(c.name)}</span>
              )}
            </div>
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900">{c.name}</p><p className="text-xs text-gray-500">{c.count} việc làm</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Newsletter ──────────────────────────────────────────────────────────────

function NewsletterBanner() {
  return (
    <section className="mt-16 rounded-2xl px-6 py-12 text-center text-white sm:px-16" style={{ background: "linear-gradient(135deg, #0047CC, #003399)" }}>
      <h2 className="text-2xl font-bold sm:text-3xl">Nhận thông tin việc làm mới nhất</h2>
      <p className="mt-2 text-sm text-white/70">Đăng ký để nhận thông báo về các cơ hội việc làm IT phù hợp</p>
      <form className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
        <input type="email" placeholder="Nhập email của bạn" className="flex-1 rounded-xl border-0 px-4 py-3 text-sm text-white outline-none ring-1 ring-inset ring-white/20 placeholder:text-white/40 focus:ring-white/50" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
        <button type="submit" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold transition-colors hover:bg-gray-100" style={{ color: "#0047CC" }}>Đăng ký ngay</button>
      </form>
    </section>
  );
}

// ── Pagination ──────────────────────────────────────────────────────────────

interface PaginationProps { page: number; total: number; limit: number; onPageChange: (p: number) => void; }

function Pagination({ page, total, limit, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="mt-10 flex items-center justify-center gap-1">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30">← Trước</button>
      {pages.map((p) => (
        <button key={p} onClick={() => onPageChange(p)} className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${p === page ? "text-white" : "text-gray-600 hover:bg-gray-100"}`} style={p === page ? { backgroundColor: "#0047CC" } : undefined}>{p}</button>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30">Sau →</button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export function JobsPage() {
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [skill, setSkill] = useState(searchParams.get("skill") || "");
  const [page, setPage] = useState(1);
  const [topJobs, setTopJobs] = useState<JobListItem[]>([]);

  useEffect(() => { getJobs({ limit: 100 }).then((d) => setTopJobs(d.items)).catch(() => {}); }, []);

  const { jobs, total, loading, error, page: resolvedPage } = useJobs({ keyword, location, skill, page, limit: 12 });

  const handleClear = useCallback(() => { setKeyword(""); setLocation(""); setSkill(""); setPage(1); }, []);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      {/* Filters */}
      <div className="mb-6">
        <JobFilters keyword={keyword} location={location} skill={skill} total={total} onClear={handleClear} />
      </div>

      {/* Section title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Việc Làm IT Mới Nhất</h2>
        <p className="mt-1 text-sm text-gray-500">{total > 0 ? `${total} việc làm đang tuyển dụng` : "Đang tải..."}</p>
      </div>

      {/* Error */}
      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-center text-sm text-red-700">{error}</div>}

      {/* Loading */}
      {loading && !error && <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}</div>}

      {/* Empty */}
      {!loading && !error && jobs.length === 0 && (
        <div className="flex flex-col items-center py-24 text-center">
          <svg className="h-20 w-20 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
          <h3 className="mt-5 text-lg font-semibold text-gray-700">Không tìm thấy việc làm phù hợp</h3>
          <p className="mt-1 text-sm text-gray-500">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
          <button onClick={handleClear} className="mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ backgroundColor: "#0047CC" }}>Xoá bộ lọc</button>
        </div>
      )}

      {/* Job cards */}
      {!loading && !error && jobs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      <Pagination page={resolvedPage} total={total} limit={12} onPageChange={setPage} />

      {!loading && !error && topJobs.length > 0 && <TopCompanies jobs={topJobs} />}
      <NewsletterBanner />
    </div>
  );
}
