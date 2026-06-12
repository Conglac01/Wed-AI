import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
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
    <section className="max-w-[1280px] mx-auto px-4 mt-14 sm:px-6 sm:mt-20">
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
  {
    title: "Lập trình viên sẽ 'tuyệt chủng'? 26 dự đoán về tương lai ngành IT",
    desc: "Cùng khám phá những dự đoán táo bạo về tương lai của lập trình viên trong kỷ nguyên AI...",
    tag: "Xu hướng",
    date: "06/2026",
    color: "#0047CC",
    url: "https://dev.to/ad_soares_9901444a323f3e2/the-end-of-the-programmer-26-predictions-i-dare-you-to-break-5g8c",
    image: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fadsoares.github.io%2Fthe-end-of-the-programmer%2Fcover.jpg",
  },
  {
    title: "Lộ trình tự học trở thành AI Engineer năm 2026",
    desc: "Từ Python cơ bản đến RAG, AI Agents & MLOps — lộ trình 8-12 tháng chi tiết cho developer...",
    tag: "Nghề nghiệp",
    date: "05/2026",
    color: "#10B981",
    url: "https://www.kdnuggets.com/how-to-become-an-ai-engineer-in-2026-a-self-study-roadmap",
    image: "",
  },
  {
    title: "Cách viết CV IT để được nhà tuyển dụng chú ý ngay",
    desc: "Những điều hiring manager thực sự tìm kiếm trong CV — từ kinh nghiệm đến kỹ năng thực tế...",
    tag: "CV",
    date: "04/2026",
    color: "#8B5CF6",
    url: "https://www.freecodecamp.org/news/how-to-land-your-first-cloud-or-devops-role-what-hiring-managers-actually-look-for/",
    image: "https://cdn.hashnode.com/uploads/covers/5e1e335a7a1d3fcc59028c64/374e807b-a67f-4f04-a639-dfa230b0ba5f.png",
  },
  {
    title: "Remote work 2026: Hybrid là tiêu chuẩn mới của ngành IT",
    desc: "83% nhân viên muốn hybrid, AI đang định hình lại cách chúng ta làm việc từ xa...",
    tag: "Làm việc",
    date: "06/2026",
    color: "#F59E0B",
    url: "https://dev.to/hxii/i-dont-need-an-office-3dja",
    image: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F2bkf29sla85tu143huzx.png",
  },
];

const ACTION_CARDS = [
  { icon: "📤", title: "Tải CV lên", desc: "Upload CV để AI phân tích", to: "/cv-analysis", color: "#0047CC" },
  { icon: "📊", title: "Phân tích CV", desc: "Nhận đánh giá chi tiết từ AI", to: "/cv-analysis", color: "#10B981" },
  { icon: "💼", title: "Tìm việc phù hợp", desc: "Khám phá cơ hội IT mới nhất", to: "/jobs", color: "#F59E0B" },
  { icon: "🤖", title: "Phỏng vấn với AI", desc: "Luyện tập phỏng vấn thực tế", to: "/interview", color: "#8B5CF6" },
  { icon: "📋", title: "Xem lịch sử", desc: "Xem lại các buổi phỏng vấn", to: "/interview-history", color: "#EF4444" },
];

function CareerBlog() {
  return (
    <section className="max-w-[1280px] mx-auto px-4 mt-14 mb-14 sm:px-6 sm:mt-20 sm:mb-20">
      <h2 className="text-2xl font-bold text-gray-900">Blog Nghề Nghiệp</h2>
      <p className="mt-1 text-sm text-gray-500">Kiến thức và kinh nghiệm cho dân IT</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {BLOG_POSTS.map((post) => (
          <a
            key={post.url}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group cursor-pointer rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden no-underline"
          >
            {post.image ? (
              <div className="h-36 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to gradient on image load error
                    const el = e.currentTarget.parentElement!;
                    el.style.background = `linear-gradient(135deg, ${post.color}20, ${post.color}40)`;
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="h-36" style={{ background: `linear-gradient(135deg, ${post.color}20, ${post.color}40)` }} />
            )}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: post.color }}>{post.tag}</span>
                <span className="text-xs text-gray-400">{post.date}</span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#0047CC] transition-colors line-clamp-2">{post.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{post.desc}</p>
            </div>
          </a>
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

  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          HERO — full image banner, right below navbar
          ═══════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[400px] sm:min-h-[500px] lg:aspect-[2/1]">
        {/* min-h on mobile ensures enough room for hero content;
            aspect-[2/1] on lg+ restores the wide banner ratio */}
        <img
          src={heroBg}
          alt=""
          className="block absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />

        {/* Overlay content — positioned on top of image */}
        <div className="absolute inset-0 z-10 mx-auto flex w-full max-w-[1280px] flex-col items-center px-4 pt-6 text-center sm:px-6 sm:pt-8 lg:pt-10">
          <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-3xl lg:text-5xl">
            {heroTotal > 0 ? `${heroTotal.toLocaleString("vi-VN")} IT Jobs cho Developer Việt Nam` : "IT Jobs cho Developer Việt Nam"}
          </h1>
          <p className="mt-3 text-sm text-white/80 drop-shadow sm:mt-4 sm:text-base lg:text-lg">
            Khám phá hàng ngàn cơ hội việc làm IT từ các công ty hàng đầu
          </p>

          {/* Search bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(keyword, location); }}
            className="mx-auto mt-6 flex h-12 w-full max-w-[900px] items-center overflow-hidden rounded-[50px] bg-white shadow-xl sm:mt-8 sm:h-14"
            style={{ padding: "5px" }}
          >
            <div className="flex h-full w-[28%] min-w-0 items-center gap-1 pl-2 sm:w-[25%] sm:gap-1.5 sm:pl-4">
              <svg className="h-3.5 w-3.5 shrink-0 text-gray-400 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Địa điểm" className="h-full w-full border-0 bg-transparent text-xs text-gray-900 placeholder-gray-400 outline-none sm:text-sm" />
            </div>
            <div className="mx-1 h-4 w-px shrink-0 bg-gray-200 sm:h-5" />
            <div className="flex h-full flex-1 min-w-0 items-center gap-1 pl-2 sm:gap-1.5 sm:pl-3">
              <svg className="h-3.5 w-3.5 shrink-0 text-gray-400 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm vị trí, công ty, kỹ năng..." className="h-full w-full border-0 bg-transparent text-xs text-gray-900 placeholder-gray-400 outline-none sm:text-sm" />
            </div>
            <button type="submit" className="flex h-[calc(100%-4px)] w-[26%] shrink-0 items-center justify-center gap-1 rounded-[44px] px-2 text-xs font-semibold text-white transition-colors hover:opacity-90 sm:h-11 sm:w-[20%] sm:gap-1.5 sm:px-6 sm:text-sm" style={{ backgroundColor: "#0047CC" }}>
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <span className="hidden sm:inline">Tìm kiếm</span>
            </button>
          </form>

          {/* Skill chips */}
          <div className="mx-auto mt-4 flex w-full max-w-[900px] flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:gap-2">
            <span className="mr-1 text-[10px] text-white/60 drop-shadow sm:text-xs">Gợi ý:</span>
            {SKILL_CHIPS.map((s) => (
              <button key={s} type="button" onClick={() => handleSkillClick(s)} className="rounded-full px-2.5 py-0.5 text-[10px] text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-3 sm:py-1 sm:text-xs" style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>{s}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          ACTION CARDS — auth users only
          ═══════════════════════════════════════════════════ */}
      {isAuthenticated && (
        <section className="max-w-[1280px] mx-auto px-4 mt-10 sm:px-6 sm:mt-14">
          <h2 className="text-2xl font-bold text-gray-900">Bạn muốn làm gì hôm nay?</h2>
          <p className="mt-1 text-sm text-gray-500">Khám phá các tính năng thông minh dành cho bạn</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ACTION_CARDS.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md no-underline"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  {card.icon}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{card.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          LATEST JOBS — 3 cols × 4 rows, paginated
          ═══════════════════════════════════════════════════ */}
      <section className="max-w-[1280px] mx-auto px-4 mt-10 sm:px-6 sm:mt-14">
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
