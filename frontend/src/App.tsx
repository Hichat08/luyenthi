import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import SignInPage from "./pages/SignInPage";
import ChatAppPage from "./pages/ChatAppPage";
import { Toaster } from "sonner";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useThemeStore } from "./stores/useThemeStore";
import { useEffect } from "react";
import { useAuthStore } from "./stores/useAuthStore";
import { useSocketStore } from "./stores/useSocketStore";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import PracticePage from "./pages/PracticePage";
import RankingPage from "./pages/RankingPage";
import SubjectPracticePage from "./pages/SubjectPracticePage";
import MultipleChoiceExamPage from "./pages/MultipleChoiceExamPage";
import LiteratureExamPage from "./pages/LiteratureExamPage";
import ExamResultPage from "./pages/ExamResultPage";
import ExamDetailedSolutionPage from "./pages/ExamDetailedSolutionPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminExamBuilderPage from "./pages/AdminExamBuilderPage";

function App() {
  const { isDark, setTheme } = useThemeStore();
  const { accessToken } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    setTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    }

    return () => disconnectSocket();
  }, [accessToken]);

  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          {/* public routes */}
          <Route
            path="/signin"
            element={<SignInPage />}
          />
          <Route
            path="/signup"
            element={<SignUpPage />}
          />

          {/* protectect routes */}
          <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
            <Route
              path="/home"
              element={<HomePage />}
            />
            <Route
              path="/profile"
              element={<ProfilePage />}
            />
            <Route
              path="/practice"
              element={<PracticePage />}
            />
            <Route
              path="/practice/:subjectSlug"
              element={<SubjectPracticePage />}
            />
            <Route
              path="/practice/:subjectSlug/exam/:examId"
              element={<MultipleChoiceExamPage />}
            />
            <Route
              path="/practice/:subjectSlug/exam/:examId/result"
              element={<ExamResultPage />}
            />
            <Route
              path="/practice/:subjectSlug/exam/:examId/solutions"
              element={<ExamDetailedSolutionPage />}
            />
            <Route
              path="/practice/:subjectSlug/essay/:examId"
              element={<LiteratureExamPage />}
            />
            <Route
              path="/chat"
              element={<ChatAppPage />}
            />
            <Route
              path="/ranking"
              element={<RankingPage />}
            />
            <Route
              path="/"
              element={<Navigate to="/home" replace />}
            />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route
              path="/admin"
              element={<AdminDashboardPage />}
            />
            <Route
              path="/admin/notifications"
              element={<AdminNotificationsPage />}
            />
            <Route
              path="/admin/analytics"
              element={<AdminAnalyticsPage />}
            />
            <Route
              path="/admin/exams/new"
              element={<AdminExamBuilderPage />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
