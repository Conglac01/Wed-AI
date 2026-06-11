import { useCallback, useEffect, useState } from "react";
import type { JobDetail } from "../types";
import { getJobById } from "../services/jobsService";

interface UseJobDetailResult {
  job: JobDetail | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useJobDetail(id: number): UseJobDetailResult {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await getJobById(id);
      setJob(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "NOT_FOUND") {
        setNotFound(true);
      } else {
        const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { job, loading, error, notFound };
}
