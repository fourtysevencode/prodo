import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FocusProvider } from "./context/FocusContext";
import Layout from "./components/Layout";
import WhimsicalLayout from "./components/WhimsicalLayout";
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

// Whimsical Frontend Pages for beta.prodo.live
import WhimsicalFocusPage from "./pages/whimsical/WhimsicalFocusPage";
import WhimsicalLogsPage from "./pages/whimsical/WhimsicalLogsPage";
import WhimsicalLeaderboardPage from "./pages/whimsical/WhimsicalLeaderboardPage";
import WhimsicalVaultPage from "./pages/whimsical/WhimsicalVaultPage";
import WhimsicalFriendsPage from "./pages/whimsical/WhimsicalFriendsPage";
import WhimsicalSettingsPage from "./pages/whimsical/WhimsicalSettingsPage";

function MainAppRoutes() {
  const isWwwDomain = typeof window !== "undefined" && window.location.hostname === "www.prodo.live";
  const isDevDomain = typeof window !== "undefined" && window.location.hostname === "dev.prodo.live";
  const isBetaDomain = typeof window !== "undefined" && (window.location.hostname === "beta.prodo.live" || window.location.hostname === "beta.localhost");

  // www.prodo.live renders ONLY the Landing Page.
  if (isWwwDomain) {
    return (
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  // dev.prodo.live renders ONLY the Developer Portal.
  if (isDevDomain) {
    return (
      <Routes>
        <Route path="*" element={<DevPage />} />
      </Routes>
    );
  }

  // beta.prodo.live renders ONLY the Whimsical & Joyful Frontend.
  if (isBetaDomain) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/beta/focus" replace />} />
        <Route path="/beta" element={<Navigate to="/beta/focus" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/punishments" element={<PunishmentsPage />} />

        <Route path="/beta/focus" element={<WhimsicalLayout><WhimsicalFocusPage /></WhimsicalLayout>} />
        <Route path="/beta/logs" element={<WhimsicalLayout><WhimsicalLogsPage /></WhimsicalLayout>} />
        <Route path="/beta/leaderboard" element={<WhimsicalLayout><WhimsicalLeaderboardPage /></WhimsicalLayout>} />
        <Route path="/beta/vault" element={<WhimsicalLayout><WhimsicalVaultPage /></WhimsicalLayout>} />
        <Route path="/beta/friends" element={<WhimsicalLayout><WhimsicalFriendsPage /></WhimsicalLayout>} />
        <Route path="/beta/settings" element={<WhimsicalLayout><WhimsicalSettingsPage /></WhimsicalLayout>} />
        
        <Route path="*" element={<WhimsicalLayout><WhimsicalFocusPage /></WhimsicalLayout>} />
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

      {/* Whimsical Frontend Routes (Available on standard domain via /beta) */}
      <Route path="/beta" element={<Navigate to="/beta/focus" replace />} />
      <Route path="/beta/focus" element={<WhimsicalLayout><WhimsicalFocusPage /></WhimsicalLayout>} />
      <Route path="/beta/logs" element={<WhimsicalLayout><WhimsicalLogsPage /></WhimsicalLayout>} />
      <Route path="/beta/leaderboard" element={<WhimsicalLayout><WhimsicalLeaderboardPage /></WhimsicalLayout>} />
      <Route path="/beta/vault" element={<WhimsicalLayout><WhimsicalVaultPage /></WhimsicalLayout>} />
      <Route path="/beta/friends" element={<WhimsicalLayout><WhimsicalFriendsPage /></WhimsicalLayout>} />
      <Route path="/beta/settings" element={<WhimsicalLayout><WhimsicalSettingsPage /></WhimsicalLayout>} />

      {/* Core Tactical App Views nested in Layout */}
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
