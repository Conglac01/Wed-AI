import { useCallback, useEffect, useState } from "react";
import type { JobListItem, JobListParams } from "../types";
import { getJobs } from "../services/jobsService";

interface UseJobsResult {
  jobs: JobListItem[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJobs(params: JobListParams = {}): UseJobsResult {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [resolvedPage, setResolvedPage] = useState(params.page ?? 1);
  const [resolvedLimit, setResolvedLimit] = useState(params.limit ?? 12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use params.page / params.limit directly — never shadow with internal state.
  const page = params.page ?? resolvedPage;
  const limit = params.limit ?? resolvedLimit;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJobs({ ...params, page, limit });
      setJobs(data.items);
      setTotal(data.total);
      setResolvedPage(data.page);
      setResolvedLimit(data.limit);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu";
      setError(msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.keyword, params.location, params.skill, page, limit]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { jobs, total, page: resolvedPage, limit: resolvedLimit, loading, error, refetch: fetch };
}
