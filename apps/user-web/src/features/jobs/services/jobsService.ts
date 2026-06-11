import { config } from "@/app/config";
import type { JobDetail, JobListParams, JobListResponse } from "../types";

/** Shared fetch helper — follows existing authService pattern. */
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("NOT_FOUND");
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch a paginated, filtered list of jobs. */
export function getJobs(params: JobListParams = {}): Promise<JobListResponse> {
  const qs = new URLSearchParams();
  if (params.keyword) qs.set("keyword", params.keyword);
  if (params.location) qs.set("location", params.location);
  if (params.skill) qs.set("skill", params.skill);
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiGet<JobListResponse>(`/api/v1/jobs${query ? `?${query}` : ""}`);
}

/** Fetch a single job by id. */
export function getJobById(id: number): Promise<JobDetail> {
  return apiGet<JobDetail>(`/api/v1/jobs/${id}`);
}
