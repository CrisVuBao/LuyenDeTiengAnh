import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import PageLoader from "./components/PageLoader";
import Home from "./features/dashboard/components/Home"; // Dashboard KHÔNG lazy (trang chính theo B.4)
import useAuthStore from "./store/authStore";
import authApi from "./api/authApi";
import { Toaster } from "react-hot-toast";

// LAZY LOAD tất cả trang khác → giảm bundle size (B.4)
const LandingPage = lazy(() => import("./features/public/LandingPage"));
const Auth = lazy(() => import("./features/auth/components/Auth"));
const ToeicStudyPage = lazy(() => import("./features/toeic/ToeicStudyPage"));
const AdminPanel = lazy(() => import("./features/admin/components/AdminPanel"));
const Profile = lazy(() => import("./pages/Profile"));

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
};

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);

  // Đồng bộ session khi F5/reload — cookie vẫn còn, lấy lại profile (B.4)
  useEffect(() => {
    if (isAuthenticated) {
      authApi.getProfile()
        .then((res) => {
          if (res?.data) updateUser(res.data);
        })
        .catch(() => {
          /* 401 → interceptor tự logout */
        });
    }
  }, [isAuthenticated, updateUser]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected Routes with App Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/toeic" element={<ToeicStudyPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
