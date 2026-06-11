/** Mirror of backend JobListItem — lightweight list representation. */
export interface JobListItem {
  id: number;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string;
  salary_text: string | null;
  skills: string[] | null;
  quality_score: number;
  is_active: boolean;
  created_at: string;
}

/** Mirror of backend JobRead — full detail representation. */
export interface JobDetail {
  id: number;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string;
  salary_text: string | null;
  salary_min: number | null;
  salary_max: number | null;
  skills: string[] | null;
  description: string;
  requirements: string | null;
  benefits: string | null;
  deadline: string | null;
  source_name: string | null;
  source_url: string | null;
  quality_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Mirror of backend JobListResponse. */
export interface JobListResponse {
  items: JobListItem[];
  total: number;
  page: number;
  limit: number;
}

/** Query parameters for GET /api/v1/jobs. */
export interface JobListParams {
  keyword?: string;
  location?: string;
  skill?: string;
  page?: number;
  limit?: number;
}
