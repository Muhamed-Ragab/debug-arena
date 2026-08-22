import { Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import LandingPage from "./features/landing/LandingPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ChallengeBrowserPage from "./features/browser/ChallengeBrowserPage";
import ChallengePage from "./features/challenge/ChallengePage";
import ResultsPage from "./features/results/ResultsPage";
import ProfilePage from "./features/profile/ProfilePage";
import ProfileSettingsPage from "./features/profile/ProfileSettingsPage";
import LeaderboardPage from "./features/leaderboard/LeaderboardPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<AppShell />}>
        <Route path="/challenges" element={<ChallengeBrowserPage />} />
        <Route path="/challenges/:id" element={<ChallengePage />} />
        <Route path="/submissions/:id/results" element={<ResultsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<ProfileSettingsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Route>
    </Routes>
  );
}
