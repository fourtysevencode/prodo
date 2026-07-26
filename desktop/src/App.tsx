import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FocusProvider, useFocus } from "./context/FocusContext";
import WhimsicalLayout from "./components/WhimsicalLayout";
import FocusPage from "./pages/FocusPage";
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
  const { isAuthenticated } = useFocus();

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

  // Enforce Token Authentication: Redirect unauthenticated sessions to LoginPage
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/authorize-desktop" element={<AuthorizeDesktopPage />} />
        <Route path="*" element={<LoginPage />} />
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

      {/* Core App Views nested in WhimsicalLayout */}
      <Route path="/focus" element={<WhimsicalLayout><FocusPage /></WhimsicalLayout>} />
      <Route path="/leaderboard" element={<WhimsicalLayout><LeaderboardPage /></WhimsicalLayout>} />
      <Route path="/vault" element={<WhimsicalLayout><VaultPage /></WhimsicalLayout>} />
      <Route path="/friends" element={<WhimsicalLayout><FriendsPage /></WhimsicalLayout>} />
      <Route path="/settings" element={<WhimsicalLayout><SettingsPage /></WhimsicalLayout>} />
      <Route path="/help" element={<WhimsicalLayout><HelpPage /></WhimsicalLayout>} />

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
