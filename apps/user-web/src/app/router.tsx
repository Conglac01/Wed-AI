import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserLayout } from "@/shared/layouts/UserLayout";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { HomePage } from "@/features/home/pages/HomePage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";

const ProfilePlaceholder = () => (
  <div className="flex flex-col items-center gap-4 py-16">
    <h1 className="text-3xl font-bold text-gray-900">Trang cá nhân</h1>
    <p className="text-gray-500">Tính năng đang được phát triển.</p>
  </div>
);

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes — full-screen two-column layout */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Main app routes — header + content + footer */}
        <Route element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePlaceholder />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
