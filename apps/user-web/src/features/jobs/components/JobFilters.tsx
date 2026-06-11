interface ActiveFiltersProps {
  keyword: string;
  location: string;
  skill: string;
  total: number;
  onClear: () => void;
}

export function JobFilters({
  keyword,
  location,
  skill,
  total,
  onClear,
}: ActiveFiltersProps) {
  const hasFilters = keyword || location || skill;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 px-5 py-3 text-sm">
      <span className="font-medium text-gray-700">
        {total} việc làm được tìm thấy
      </span>

      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {keyword && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              🔍 {keyword}
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              📍 {location}
            </span>
          )}
          {skill && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
              💡 {skill}
            </span>
          )}
          <button
            onClick={onClear}
            className="ml-1 text-xs font-medium text-gray-400 hover:text-blue-600 transition-colors"
          >
            Xoá tất cả
          </button>
        </div>
      )}
    </div>
  );
}
