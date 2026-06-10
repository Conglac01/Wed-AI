import { useCallback, useEffect, useState } from "react";
import { getBackendHealth, type HealthStatus } from "@/shared/services/healthService";

export function useHealthStatus() {
  const [status, setStatus] = useState<HealthStatus>("unavailable");
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    const s = await getBackendHealth();
    setStatus(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  return { status, loading, refetch: check };
}
