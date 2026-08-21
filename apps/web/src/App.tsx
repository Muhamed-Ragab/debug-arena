import { Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import ChallengeBrowserPage from "./features/browser/ChallengeBrowserPage";
import ChallengePage from "./features/challenge/ChallengePage";
import ResultsPage from "./features/results/ResultsPage";
import ProfilePage from "./features/profile/ProfilePage";
import LeaderboardPage from "./features/leaderboard/LeaderboardPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<ChallengeBrowserPage />} />
        <Route path="/challenges/:id" element={<ChallengePage />} />
        <Route path="/submissions/:id/results" element={<ResultsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Route>
    </Routes>
  );
}
