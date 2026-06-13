import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserLayout } from "@/shared/layouts/UserLayout";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { HomePage } from "@/features/home/pages/HomePage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { JobsPage } from "@/features/jobs/pages/JobsPage";
import { JobDetailPage } from "@/features/jobs/pages/JobDetailPage";
import { CVAnalysisPage } from "@/features/cv-analysis/pages/CVAnalysisPage";

const Placeholder = ({ title, desc }: { title: string; desc: string }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 mb-6">
      <svg className="h-10 w-10 text-[#0047CC]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    </div>
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <p className="mt-2 text-sm text-gray-500 max-w-md">{desc}</p>
  </div>
);

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="cv-analysis" element={<CVAnalysisPage />} />
          <Route path="interview" element={<Placeholder title="Phỏng Vấn với AI" desc="Epic 6 — AI Interview. Tính năng đang được phát triển." />} />
          <Route path="ai-interview" element={<Placeholder title="Phỏng Vấn AI" desc="Epic 6 — AI Interview. Tính năng đang được phát triển." />} />
          <Route path="interview-history" element={<Placeholder title="Lịch Sử Phỏng Vấn" desc="Epic 6 — Interview History. Tính năng đang được phát triển." />} />
          <Route path="settings" element={<Placeholder title="Cài Đặt" desc="Thiết lập tài khoản người dùng. Tính năng đang được phát triển." />} />
          <Route path="profile" element={<ProtectedRoute><Placeholder title="Trang cá nhân" desc="Thông tin hồ sơ cá nhân. Tính năng đang được phát triển." /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
