import type { CVExtractedInfo } from "../types";

function SkillTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium" style={{ color: "#0047CC" }}>
      {label}
    </span>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-50 text-gray-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 leading-tight">{label}</p>
        <p className="text-[13px] font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

interface CVExtractedInfoPreviewProps {
  info: CVExtractedInfo;
  className?: string;
}

export function CVExtractedInfoPreview({
  info,
  className = "",
}: CVExtractedInfoPreviewProps) {
  return (
    <div className={`rounded-lg border border-gray-100 bg-white p-4 ${className}`}>
      <h3 className="text-[13px] font-semibold text-gray-900">
        Thông tin CV (đã trích xuất sơ bộ)
      </h3>

      {/* Name + title highlight */}
      <div className="mt-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: "#F0F5FF" }}>
        <p className="text-base font-bold text-gray-900">{info.fullName}</p>
        <p className="text-[13px] font-medium" style={{ color: "#0047CC" }}>{info.title}</p>
        <p className="mt-0.5 text-[11px] text-gray-400">{info.yearsOfExperience}+ năm kinh nghiệm</p>
      </div>

      {/* Contact + Education */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <InfoRow
          icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          }
          label="Email"
          value={info.email}
        />
        <InfoRow
          icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          }
          label="Phone"
          value={info.phone}
        />
        <InfoRow
          icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          }
          label="Học vấn"
          value={info.education}
        />
      </div>

      {/* Skills */}
      <div className="mt-3">
        <p className="text-[11px] font-medium text-gray-400 mb-1.5">Kỹ năng</p>
        <div className="flex flex-wrap gap-1.5">
          {info.skills.map((skill) => (
            <SkillTag key={skill} label={skill} />
          ))}
          {info.additionalSkillCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-400">
              +{info.additionalSkillCount} kỹ năng khác
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
