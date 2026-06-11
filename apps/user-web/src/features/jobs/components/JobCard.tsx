import { useState } from "react";
import { Link } from "react-router-dom";
import type { JobListItem } from "../types";

interface JobCardProps {
  job: JobListItem;
}

function companyInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!)
    .join("")
    .toUpperCase();
}

/** Logo with React-state-driven fallback. No DOM mutations. */
function CompanyLogo({
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
        {companyInitials(companyName)}
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

export function JobCard({ job }: JobCardProps) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group relative flex cursor-pointer gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      {/* Company logo */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
        <CompanyLogo
          logoUrl={job.company_logo_url}
          companyName={job.company_name}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 transition-colors line-clamp-2 group-hover:text-[#0047CC]">
          {job.title}
        </h3>

        {/* Company */}
        <p className="mt-0.5 text-sm text-gray-500">{job.company_name}</p>

        {/* Location */}
        {job.location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {job.location}
          </p>
        )}

        {/* Salary — orange #E85D04 */}
        {job.salary_text && (
          <p className="mt-1 text-sm font-semibold" style={{ color: "#E85D04" }}>
            {job.salary_text}
          </p>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-400">
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
