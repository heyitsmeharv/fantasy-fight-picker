import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import HomePage from "../pages/HomePage";
import UpcomingPage from "../pages/UpcomingPage";
import EventPage from "../pages/EventPage";
import FightersPage from "../pages/FightersPage";
import FighterPage from "../pages/FighterPage";
import ComparePage from "../pages/ComparePage";
import LeaderboardPage from "../pages/LeaderboardPage";
import LeaguePage from "../pages/LeaguePage";
import MyPicksPage from "../pages/MyPicksPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import AdminResultsPage from "../pages/AdminResultsPage";
import AdminEventsPage from "../pages/AdminEventsPage";
import AdminFightersPage from "../pages/AdminFightersPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/upcoming" element={<UpcomingPage />} />
        <Route path="/events/:eventId" element={<EventPage />} />
        <Route path="/fighters" element={<FightersPage />} />
        <Route path="/fighters/:fighterId" element={<FighterPage />} />
        <Route path="/compare/:fightId" element={<ComparePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route
          path="/league"
          element={
            <ProtectedRoute>
              <LeaguePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-picks"
          element={
            <ProtectedRoute>
              <MyPicksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute adminOnly>
              <AdminEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fighters"
          element={
            <ProtectedRoute adminOnly>
              <AdminFightersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/results"
          element={
            <ProtectedRoute adminOnly>
              <AdminResultsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;