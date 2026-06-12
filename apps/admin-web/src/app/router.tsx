import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/shared/layouts/AdminLayout";
import { AdminDashboardPage } from "@/features/dashboard/pages/AdminDashboardPage";
import { AdminLoginPage } from "@/features/admin-auth/pages/AdminLoginPage";
import { AdminJobsPage } from "@/features/jobs/pages/AdminJobsPage";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="login" element={<AdminLoginPage />} />
          <Route path="jobs" element={<AdminJobsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
