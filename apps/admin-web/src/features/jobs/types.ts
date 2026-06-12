// ── Job types for Admin ──────────────────────────────────────────────────────

export interface AdminJob {
  id: number;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string;
  salary_text: string | null;
  skills: string[] | null;
  source_name: string | null;
  quality_score: number | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminJobListResponse {
  items: AdminJob[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminJobFilters {
  keyword: string;
  location: string;
  skill: string;
  status: "all" | "active" | "inactive";
  source: string;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_FILTERS: AdminJobFilters = {
  keyword: "",
  location: "",
  skill: "",
  status: "all",
  source: "",
  dateFrom: "",
  dateTo: "",
};

export interface ImportLogEntry {
  id: string;
  time: string;
  source: string;
  total_imported: number;
  total_skipped: number;
  total_failed: number;
  status: "success" | "partial" | "failed";
  message: string;
}
