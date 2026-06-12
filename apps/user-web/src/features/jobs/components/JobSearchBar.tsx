import { type FormEvent, useState } from "react";

interface JobSearchBarProps {
  onSearch: (keyword: string, location: string) => void;
  onSkillClick: (skill: string) => void;
  initialKeyword?: string;
  initialLocation?: string;
}

const SUGGESTED_SKILLS = [
  "React",
  "Python",
  "Java",
  "NodeJS",
  "Docker",
  "AWS",
  "AI Engineer",
  "Data Engineer",
];

export function JobSearchBar({
  onSearch,
  onSkillClick,
  initialKeyword = "",
  initialLocation = "",
}: JobSearchBarProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch(keyword.trim(), location.trim());
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Single pill search bar */}
      <form
        onSubmit={handleSubmit}
        className="flex h-12 items-center overflow-hidden rounded-[50px] bg-white shadow-sm sm:h-14"
        style={{ padding: "5px" }}
      >
        {/* Location input */}
        <div className="flex h-full w-[28%] min-w-0 items-center gap-1 pl-2 sm:w-[25%] sm:gap-1.5 sm:pl-3">
          <svg
            className="h-3.5 w-3.5 shrink-0 text-gray-400 sm:h-4 sm:w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Địa điểm"
            className="h-full w-full border-0 bg-transparent text-xs text-gray-900 placeholder-gray-400 outline-none sm:text-sm"
          />
        </div>

        {/* Divider */}
        <div className="mx-1 h-4 w-px shrink-0 bg-gray-200 sm:h-5" />

        {/* Keyword input */}
        <div className="flex h-full flex-1 min-w-0 items-center gap-1 pl-2 sm:gap-1.5 sm:pl-3">
          <svg
            className="h-3.5 w-3.5 shrink-0 text-gray-400 sm:h-4 sm:w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm vị trí, công ty, kỹ năng..."
            className="h-full w-full border-0 bg-transparent text-xs text-gray-900 placeholder-gray-400 outline-none sm:text-sm"
          />
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="flex h-[calc(100%-4px)] w-[26%] shrink-0 items-center justify-center gap-1 rounded-[44px] px-2 text-xs font-semibold text-white transition-colors sm:h-11 sm:w-[20%] sm:gap-1.5 sm:px-5 sm:text-sm"
          style={{ backgroundColor: "#0047CC" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#003399")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0047CC")}
        >
          <svg
            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <span className="hidden sm:inline">Tìm kiếm</span>
        </button>
      </form>

      {/* Skill chips — below search bar */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {SUGGESTED_SKILLS.map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => onSkillClick(skill)}
            className="rounded-full px-4 py-1 text-xs text-white transition-colors hover:bg-white/20"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {skill}
          </button>
        ))}
      </div>
    </div>
  );
}
