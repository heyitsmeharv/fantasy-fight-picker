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
        {/* Public — auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected — all app routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/upcoming" element={<UpcomingPage />} />
          <Route path="/events/:eventId" element={<EventPage />} />
          <Route path="/fighters" element={<FightersPage />} />
          <Route path="/fighters/:fighterId" element={<FighterPage />} />
          <Route path="/events/:eventId/compare/:fightId" element={<ComparePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/league" element={<LeaguePage />} />
          <Route path="/my-picks" element={<MyPicksPage />} />
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/events" element={<AdminEventsPage />} />
            <Route path="/admin/fighters" element={<AdminFightersPage />} />
            <Route path="/admin/results" element={<AdminResultsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;