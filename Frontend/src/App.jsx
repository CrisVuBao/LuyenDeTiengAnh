import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentLayout from "./components/StudentLayout";
import AdminLayout from "./components/AdminLayout";
import PageLoader from "./components/PageLoader";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import useAuthStore from "./store/authStore";
import authApi from "./api/authApi";
import { Toaster } from "react-hot-toast";

// LAZY LOADED PAGES (Route-level Code Splitting)
const LandingPage = lazy(() => import("./features/public/LandingPage"));
const Auth = lazy(() => import("./features/auth/components/Auth"));
const StudentHome = lazy(() => import("./features/home/components/StudentHome"));
const ToeicStudyPage = lazy(() => import("./features/toeic/ToeicStudyPage"));
const Home = lazy(() => import("./features/dashboard/components/Home"));
const StudyProgressPage = lazy(() => import("./features/progress/components/StudyProgressPage"));
const AdminDashboard = lazy(() => import("./features/admin/components/AdminDashboard"));
const AdminTests = lazy(() => import("./features/admin/components/AdminTests"));
const AdminStudents = lazy(() => import("./features/admin/components/AdminStudents"));
const AdminBinoManager = lazy(() => import("./features/admin/components/AdminBinoManager"));
const Profile = lazy(() => import("./pages/Profile"));

// Bino Book Learning System
const BinoBookOverviewPage = lazy(() => import("./features/bino/BinoBookOverviewPage"));
const BinoDialogueStudyPage = lazy(() => import("./features/bino/BinoDialogueStudyPage"));
const BinoEbookViewerPage = lazy(() => import("./features/bino/BinoEbookViewerPage"));
const BinoFlashcardReviewPage = lazy(() => import("./features/bino/BinoFlashcardReviewPage"));
const BinoChapterBonusPage = lazy(() => import("./features/bino/BinoChapterBonusPage"));

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
};

// Root index redirector for logged-in users
const RootRedirector = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated) {
    if (user?.role === "Admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }
  return <LandingPage />;
};

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);

  useEffect(() => {
    if (isAuthenticated) {
      authApi.getProfile()
        .then((res) => {
          if (res?.data) updateUser(res.data);
        })
        .catch(() => {
          /* 401 interceptor auto logout */
        });
    }
  }, [isAuthenticated, updateUser]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public / Landing */}
          <Route path="/" element={<RootRedirector />} />
          <Route path="/auth" element={<Auth />} />

          {/* ======================================================== */}
          {/* STUDENT WEB APP PORTAL (Top Navbar Layout, No Sidebar)  */}
          {/* ======================================================== */}
          <Route element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
            <Route path="/home" element={<StudentHome />} />
            <Route path="/toeic" element={<ToeicStudyPage />} />
            <Route path="/dashboard" element={<Home />} />
            <Route path="/progress" element={<StudyProgressPage />} />
            <Route path="/profile" element={<Profile />} />

            {/* Bino Book Learning System Routes */}
            <Route path="/bino" element={<BinoBookOverviewPage />} />
            <Route path="/bino/dialogue/:id" element={<BinoDialogueStudyPage />} />
            <Route path="/bino/reader" element={<BinoEbookViewerPage />} />
            <Route path="/bino/flashcards" element={<BinoFlashcardReviewPage />} />
            <Route path="/bino/chapter/:chapterNumber/bonus" element={<BinoChapterBonusPage />} />
          </Route>

          {/* ======================================================== */}
          {/* ADMIN PORTAL (Admin Sidebar CMS Layout, Protected)     */}
          {/* ======================================================== */}
          <Route
            element={
              <RoleProtectedRoute allowedRoles={["Admin"]}>
                <AdminLayout />
              </RoleProtectedRoute>
            }
          >
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/tests" element={<AdminTests />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/bino" element={<AdminBinoManager />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
