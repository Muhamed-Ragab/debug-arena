import { Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import ChallengeBrowser from "./ChallengeBrowser";
import Challenge from "./Challenge";
import Results from "./Results";
import Profile from "./Profile";
import Leaderboard from "./Leaderboard";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<ChallengeBrowser />} />
        <Route path="/challenges/:id" element={<Challenge />} />
        <Route path="/submissions/:id/results" element={<Results />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Route>
    </Routes>
  );
}
