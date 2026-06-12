import { config } from "@/app/config";
import type { AdminJobListResponse, AdminJobFilters } from "../types";

const JOBS_URL = `${config.apiBaseUrl}/api/v1/jobs`;
const REQUEST_TIMEOUT_MS = 10_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function buildQuery(filters: AdminJobFilters, page: number, limit: number): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.location) params.set("location", filters.location);
  if (filters.skill) params.set("skill", filters.skill);

  // Backend currently only returns active jobs.
  // Status, source, and date-range filters are applied client-side in useAdminJobs.
  return `${JOBS_URL}?${params.toString()}`;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function fetchAdminJobs(
  filters: AdminJobFilters,
  page: number,
  limit: number,
): Promise<AdminJobListResponse> {
  const url = buildQuery(filters, page, limit);
  const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);

  if (!res.ok) {
    throw new Error(`Không thể tải danh sách việc làm (HTTP ${res.status})`);
  }

  const data: AdminJobListResponse = await res.json();
  return data;
}

// ── CSV Import (placeholder — backend endpoint not yet available) ────────────

export function isImportEndpointAvailable(): boolean {
  return false; // Backend does not have a CSV import endpoint yet.
}
