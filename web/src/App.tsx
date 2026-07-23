import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FocusProvider } from "./context/FocusContext";
import Layout from "./components/Layout";
import FocusPage from "./pages/FocusPage";
import LogsPage from "./pages/LogsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import VaultPage from "./pages/VaultPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import HelpPage from "./pages/HelpPage";
import NotFoundPage from "./pages/NotFoundPage";
import FriendsPage from "./pages/FriendsPage";
import PunishmentsPage from "./pages/PunishmentsPage";
import LandingPage from "./pages/LandingPage";
import AuthorizeDesktopPage from "./pages/AuthorizeDesktopPage";
import DevPage from "./pages/DevPage";
import TesterReviewPage from "./pages/TesterReviewPage";

function MainAppRoutes() {
  const isWwwDomain = typeof window !== "undefined" && window.location.hostname === "www.prodo.live";
  const isDevDomain = typeof window !== "undefined" && window.location.hostname === "dev.prodo.live";

  // www.prodo.live renders ONLY the Landing Page. Nothing else.
  if (isWwwDomain) {
    return (
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  // dev.prodo.live renders ONLY the Developer Portal. Nothing else.
  if (isDevDomain) {
    return (
      <Routes>
        <Route path="*" element={<DevPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Root / on prodo.live routes directly to the Focus Dashboard */}
      <Route path="/" element={<Navigate to="/focus" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/dev" element={<DevPage />} />
      <Route path="/tester-review" element={<TesterReviewPage />} />
      
      {/* Standalone Authentication & OAuth Screens */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/authorize-desktop" element={<AuthorizeDesktopPage />} />
      <Route path="/punishments" element={<PunishmentsPage />} />

      {/* Core App Views nested in Layout */}
      <Route path="/focus" element={<Layout><FocusPage /></Layout>} />
      <Route path="/logs" element={<Layout><LogsPage /></Layout>} />
      <Route path="/leaderboard" element={<Layout><LeaderboardPage /></Layout>} />
      <Route path="/vault" element={<Layout><VaultPage /></Layout>} />
      <Route path="/friends" element={<Layout><FriendsPage /></Layout>} />
      <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
      <Route path="/help" element={<Layout><HelpPage /></Layout>} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <FocusProvider>
      <Router>
        <MainAppRoutes />
      </Router>
    </FocusProvider>
  );
}

export default App;
