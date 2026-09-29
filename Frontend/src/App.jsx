import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import StudentLayout from "./components/StudentLayout";
import AdminLayout from "./components/AdminLayout";
import PageLoader from "./components/PageLoader";
import ErrorBoundary from "./components/ErrorBoundary";
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
const AdminNotifications = lazy(() => import("./features/admin/components/AdminNotifications"));
const AdminSettings = lazy(() => import("./features/admin/components/AdminSettings"));
const AdminAnalytics = lazy(() => import("./features/admin/components/AdminAnalytics"));
const AdminActivityLog = lazy(() => import("./features/admin/components/AdminActivityLog"));
const AdminContentManager = lazy(() => import("./features/admin/components/AdminContentManager"));
const Profile = lazy(() => import("./pages/Profile"));

// Real-World Communication Learning System (Hội Thoại Giao Tiếp Thực Chiến)
const BinoBookOverviewPage = lazy(() => import("./features/bino/BinoBookOverviewPage"));
const BinoDialogueStudyPage = lazy(() => import("./features/bino/BinoDialogueStudyPage"));
const BinoEbookViewerPage = lazy(() => import("./features/bino/BinoEbookViewerPage"));
const BinoFlashcardReviewPage = lazy(() => import("./features/bino/BinoFlashcardReviewPage"));
const BinoChapterBonusPage = lazy(() => import("./features/bino/BinoChapterBonusPage"));

// Reflex 50 Topics (1500 Sentences Nói - Viết Thực Chiến)
const Reflex50OverviewPage = lazy(() => import("./features/reflex50/Reflex50OverviewPage"));
const Reflex50UnitStudyPage = lazy(() => import("./features/reflex50/Reflex50UnitStudyPage"));

// 3000 Essential Vocabulary Topics System
const VocabOverviewPage = lazy(() => import("./features/vocab/VocabOverviewPage"));
const VocabStudyPage = lazy(() => import("./features/vocab/VocabStudyPage"));

// Gamification System (Leaderboard, Achievements, Streaks, Quests)
const GamificationHubPage = lazy(() => import("./features/gamification/GamificationHubPage"));

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
    <HelmetProvider>
      <ErrorBoundary>
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

                {/* Real-World Communication Learning System Routes */}
                <Route path="/communication" element={<BinoBookOverviewPage />} />
                <Route path="/communication/dialogue/:id" element={<BinoDialogueStudyPage />} />
                <Route path="/communication/reader" element={<BinoEbookViewerPage />} />
                <Route path="/communication/flashcards" element={<BinoFlashcardReviewPage />} />
                <Route path="/communication/chapter/:chapterNumber/bonus" element={<BinoChapterBonusPage />} />

                {/* Backward Compatibility Redirects from old /bino routes */}
                <Route path="/bino" element={<Navigate to="/communication" replace />} />
                <Route path="/bino/dialogue/:id" element={<Navigate to="/communication" replace />} />
                <Route path="/bino/reader" element={<Navigate to="/communication/reader" replace />} />
                <Route path="/bino/flashcards" element={<Navigate to="/communication/flashcards" replace />} />
                <Route path="/bino/chapter/:chapterNumber/bonus" element={<Navigate to="/communication" replace />} />

                {/* Reflex 50 Topics (1500 Sentences) Routes */}
                <Route path="/reflex-50" element={<Reflex50OverviewPage />} />
                <Route path="/reflex-50/unit/:unitNumber" element={<Reflex50UnitStudyPage />} />

                {/* 3000 Essential Vocabulary System Routes */}
                <Route path="/vocab" element={<VocabOverviewPage />} />
                <Route path="/vocab/:topicId" element={<VocabStudyPage />} />

                {/* Gamification Hub Routes */}
                <Route path="/leaderboard" element={<GamificationHubPage />} />
                <Route path="/gamification" element={<GamificationHubPage />} />
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
                <Route path="/admin/communication" element={<AdminBinoManager />} />
                <Route path="/admin/bino" element={<Navigate to="/admin/communication" replace />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/activity-log" element={<AdminActivityLog />} />
                <Route path="/admin/content" element={<AdminContentManager />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
