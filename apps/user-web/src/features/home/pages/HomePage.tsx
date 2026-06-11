import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getJobs } from "@/features/jobs/services/jobsService";
import heroBg from "@/assets/hero-bg.png";
import type { JobListItem } from "@/features/jobs/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Inline SVG — quiet gray building icon, used as img fallback. */
const COMPANY_PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#F3F4F6"/><path d="M20 44V28l12-8 12 8v16H32v-8h-4v8H20z" fill="#9CA3AF"/><rect x="28" y="20" width="8" height="4" rx="1" fill="#D1D5DB"/></svg>'
);

function companyInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]!).join("").toUpperCase();
}

const SKILL_CHIPS = ["React", "Python", "Java", "NodeJS", "Docker", "AWS", "AI Engineer", "Data Engineer"];

// ── Skeleton ─────────────────────────────────────────────────────────────────

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

// ── Mini JobCard ─────────────────────────────────────────────────────────────

function MiniJobCard({ job }: { job: JobListItem }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group flex cursor-pointer gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
        {job.company_logo_url ? (
          <img
            src={job.company_logo_url}
            alt={job.company_name}
            className="h-full w-full object-contain p-1"
            onError={(e) => {
              e.currentTarget.src = COMPANY_PLACEHOLDER;
              e.currentTarget.onerror = null;
            }}
          />
        ) : (
          <span className="text-sm font-bold text-gray-400">{companyInitials(job.company_name)}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-[#0047CC] transition-colors">{job.title}</h3>
        <p className="mt-0.5 text-sm text-gray-500">{job.company_name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
          {job.location && <span>{job.location}</span>}
          {job.salary_text && <span className="font-semibold" style={{ color: "#E85D04" }}>{job.salary_text}</span>}
        </div>
      </div>
    </Link>
  );
}

// ── Top Companies ─────────────────────────────────────────────────────────────

interface CompanyGroup { name: string; logo: string | null; count: number; }

function TopCompanies({ jobs }: { jobs: JobListItem[] }) {
  const companies = useMemo(() => {
    const map = new Map<string, { logo: string | null; count: number }>();
    for (const job of jobs) { const e = map.get(job.company_name); if (e) e.count++; else map.set(job.company_name, { logo: job.company_logo_url, count: 1 }); }
    const r: CompanyGroup[] = []; for (const [n, d] of map) r.push({ name: n, logo: d.logo, count: d.count });
    r.sort((a, b) => b.count - a.count); return r.slice(0, 8);
  }, [jobs]);
  if (companies.length < 4) return null;

  return (
    <section className="max-w-[1280px] mx-auto px-6 mt-20">
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

// ── Blog Cards ───────────────────────────────────────────────────────────────

const BLOG_POSTS = [
  { title: "5 Kỹ năng IT hot nhất 2026", desc: "Khám phá những kỹ năng công nghệ được săn đón nhất...", tag: "Xu hướng", date: "10/06/2026", color: "#0047CC" },
  { title: "Lộ trình trở thành AI Engineer", desc: "Từ fresher đến chuyên gia AI — lộ trình chi tiết cho developer...", tag: "Nghề nghiệp", date: "08/06/2026", color: "#10B981" },
  { title: "Cách viết CV IT chuẩn nhà tuyển dụng", desc: "Bí quyết để CV của bạn nổi bật giữa hàng trăm ứng viên...", tag: "CV", date: "05/06/2026", color: "#8B5CF6" },
  { title: "Remote work trong ngành IT: Xu hướng mới", desc: "Làm việc từ xa đang thay đổi cách các công ty công nghệ vận hành...", tag: "Làm việc", date: "01/06/2026", color: "#F59E0B" },
];

function CareerBlog() {
  return (
    <section className="max-w-[1280px] mx-auto px-6 mt-20 mb-20">
      <h2 className="text-2xl font-bold text-gray-900">Blog Nghề Nghiệp</h2>
      <p className="mt-1 text-sm text-gray-500">Kiến thức và kinh nghiệm cho dân IT</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {BLOG_POSTS.map((post) => (
          <article key={post.title} className="group cursor-pointer rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-36" style={{ background: `linear-gradient(135deg, ${post.color}20, ${post.color}40)` }} />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: post.color }}>{post.tag}</span>
                <span className="text-xs text-gray-400">{post.date}</span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#0047CC] transition-colors line-clamp-2">{post.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{post.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── PAGE ─────────────────────────────────────────────────────────────────────

export function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [heroTotal, setHeroTotal] = useState(0);
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [topJobs, setTopJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [jobTotal, setJobTotal] = useState(0);
  const limit = 12;

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    getJobs({ limit: 1 }).then((d) => setHeroTotal(d.total)).catch(() => {});
    getJobs({ limit: 100 }).then((d) => setTopJobs(d.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getJobs({ page, limit })
      .then((d) => { setJobs(d.items); setJobTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const handleSearch = useCallback((kw: string, loc: string) => {
    window.location.href = `/jobs?keyword=${encodeURIComponent(kw)}&location=${encodeURIComponent(loc)}`;
  }, []);

  const handleSkillClick = useCallback((sk: string) => {
    window.location.href = `/jobs?skill=${encodeURIComponent(sk)}`;
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          HERO — full image banner, right below navbar
          ═══════════════════════════════════════════════════ */}
      <section className="relative w-full aspect-[2/1]">
        {/* aspect-ratio reserves height before image loads → no layout shift on refresh */}
        <img
          src={heroBg}
          alt=""
          className="block absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />

        {/* Overlay content — positioned on top of image */}
        <div className="absolute inset-0 z-10 mx-auto flex w-full max-w-[1280px] flex-col items-center px-6 pt-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
            {heroTotal > 0 ? `${heroTotal.toLocaleString("vi-VN")} IT Jobs cho Developer Việt Nam` : "IT Jobs cho Developer Việt Nam"}
          </h1>
          <p className="mt-4 text-base text-white/80 drop-shadow sm:text-lg">
            Khám phá hàng ngàn cơ hội việc làm IT từ các công ty hàng đầu
          </p>

          {/* Search bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(keyword, location); }}
            className="mx-auto mt-8 flex h-14 w-full max-w-[900px] items-center overflow-hidden rounded-[50px] bg-white shadow-xl"
            style={{ padding: "6px" }}
          >
            <div className="flex h-full w-[25%] min-w-0 items-center gap-1.5 pl-4">
              <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Địa điểm" className="h-full w-full border-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none" />
            </div>
            <div className="mx-1 h-5 w-px shrink-0 bg-gray-200" />
            <div className="flex h-full flex-1 min-w-0 items-center gap-1.5 pl-3">
              <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm vị trí, công ty, kỹ năng..." className="h-full w-full border-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none" />
            </div>
            <button type="submit" className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-[44px] px-6 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ backgroundColor: "#0047CC", width: "20%" }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <span className="hidden sm:inline">Tìm kiếm</span>
            </button>
          </form>

          {/* Skill chips */}
          <div className="mx-auto mt-5 flex w-full max-w-[900px] flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-xs text-white/60 drop-shadow">Gợi ý:</span>
            {SKILL_CHIPS.map((s) => (
              <button key={s} type="button" onClick={() => handleSkillClick(s)} className="rounded-full px-3 py-1 text-xs text-white backdrop-blur-sm transition-colors hover:bg-white/20" style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>{s}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          LATEST JOBS — 3 cols × 4 rows, paginated
          ═══════════════════════════════════════════════════ */}
      <section className="max-w-[1280px] mx-auto px-6 mt-14">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Việc Làm IT Mới Nhất</h2>
          <p className="mt-1 text-sm text-gray-500">{jobTotal} việc làm đang tuyển dụng</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => <MiniJobCard key={job.id} job={job} />)}
          </div>
        )}

        {/* Page numbers */}
        {(() => {
          const totalPages = Math.ceil(jobTotal / limit);
          if (totalPages <= 1) return null;
          return (
            <div className="mt-8 flex items-center justify-center gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-100 disabled:opacity-30">← Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${p === page ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  style={p === page ? { backgroundColor: "#0047CC" } : undefined}
                >{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-100 disabled:opacity-30">Sau →</button>
            </div>
          );
        })()}
      </section>

      {/* ═══════════════════════════════════════════════════
          TOP COMPANIES
          ═══════════════════════════════════════════════════ */}
      <TopCompanies jobs={topJobs} />

      {/* ═══════════════════════════════════════════════════
          CAREER BLOG
          ═══════════════════════════════════════════════════ */}
      <CareerBlog />

    </>
  );
}
