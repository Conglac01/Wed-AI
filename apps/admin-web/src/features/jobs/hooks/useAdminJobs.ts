import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminJobs } from "../services/adminJobsService";
import type { AdminJob, AdminJobFilters } from "../types";
import { DEFAULT_FILTERS } from "../types";

interface UseAdminJobsReturn {
  jobs: AdminJob[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  filters: AdminJobFilters;
  setPage: (p: number) => void;
  setLimit: (l: number) => void;
  setFilters: (f: AdminJobFilters) => void;
  updateFilter: <K extends keyof AdminJobFilters>(key: K, value: AdminJobFilters[K]) => void;
  refetch: () => void;
}

export function useAdminJobs(): UseAdminJobsReturn {
  const [filters, setFilters] = useState<AdminJobFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [rawJobs, setRawJobs] = useState<AdminJob[]>([]);
  const [rawTotal, setRawTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchId, setFetchId] = useState(0);

  // ── Fetch ──────────────────────────────────────────────────────────

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminJobs(filters, page, limit);
      setRawJobs(data.items);
      setRawTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      setRawJobs([]);
      setRawTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters.keyword, filters.location, filters.skill, page, limit, fetchId]);

  useEffect(() => {
    void doFetch();
  }, [doFetch]);

  const refetch = useCallback(() => setFetchId((n) => n + 1), []);

  // ── Client-side filtering for status / source / date range ────────
  // Backend only returns active jobs, so inactive filtering is limited.
  // These are applied client-side for the best UX possible.

  const jobs = useMemo(() => {
    let result = rawJobs;

    // Status filter (note: backend only returns is_active=true)
    if (filters.status === "active") {
      result = result.filter((j) => j.is_active);
    } else if (filters.status === "inactive") {
      result = result.filter((j) => !j.is_active);
    }

    // Source filter
    if (filters.source) {
      const src = filters.source.toLowerCase();
      result = result.filter((j) => (j.source_name || "").toLowerCase().includes(src));
    }

    // Date-range filter
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      result = result.filter((j) => new Date(j.created_at).getTime() >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime();
      result = result.filter((j) => new Date(j.created_at).getTime() <= to);
    }

    return result;
  }, [rawJobs, filters.status, filters.source, filters.dateFrom, filters.dateTo]);

  const total = useMemo(() => {
    // When client-side filtering is active, use filtered length
    const hasClientFilter =
      filters.status !== "all" || filters.source !== "" || filters.dateFrom !== "" || filters.dateTo !== "";
    return hasClientFilter ? jobs.length : rawTotal;
  }, [jobs.length, rawTotal, filters.status, filters.source, filters.dateFrom, filters.dateTo]);

  // ── Convenience: update single filter key ─────────────────────────

  const updateFilter = useCallback(
    <K extends keyof AdminJobFilters>(key: K, value: AdminJobFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1); // reset to page 1 on filter change
    },
    [],
  );

  return {
    jobs,
    total,
    loading,
    error,
    page,
    limit,
    filters,
    setPage,
    setLimit,
    setFilters,
    updateFilter,
    refetch,
  };
}
