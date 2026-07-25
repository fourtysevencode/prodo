import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FocusProvider, useFocus } from "./context/FocusContext";
import WhimsicalLayout from "./components/WhimsicalLayout";
import FocusPage from "./pages/theREALwhimsy/FocusPage";
import LogsPage from "./pages/theREALwhimsy/LogsPage";
import LeaderboardPage from "./pages/theREALwhimsy/LeaderboardPage";
import VaultPage from "./pages/theREALwhimsy/VaultPage";
import SettingsPage from "./pages/theREALwhimsy/SettingsPage";
import HelpPage from "./pages/theREALwhimsy/HelpPage";
import NotFoundPage from "./pages/NotFoundPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import FriendsPage from "./pages/theREALwhimsy/FriendsPage";
import LoginPage from "./pages/LoginPage";
import PunishmentsPage from "./pages/PunishmentsPage";
import LandingPage from "./pages/LandingPage";
import AuthorizeDesktopPage from "./pages/AuthorizeDesktopPage";
import DevPage from "./pages/DevPage";
import TesterReviewPage from "./pages/TesterReviewPage";

function MainAppRoutes() {
  const { isAuthenticated, isDev } = useFocus();

  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isWwwDomain = hostname === "www.prodo.live" || hostname === "www.localhost";
  const isDevDomain = hostname === "dev.prodo.live" || hostname === "dev.localhost";
  const isBetaDomain = hostname === "beta.prodo.live" || hostname === "beta.localhost";

  // beta.prodo.live renders ONLY 403 Forbidden Page now cause beta is useless (will be useful later on)
  if (isBetaDomain) {
    return (
      <Routes>
        <Route path="*" element={<ForbiddenPage message="Access to beta.prodo.live is restricted." />} />
      </Routes>
    );
  }

  // dev.prodo.live renders DevPage if account is strictly a dev account, else 403 Forbidden Page.
  if (isDevDomain) {
    if (!isDev) {
      return (
        <Routes>
          <Route path="*" element={<ForbiddenPage message="Access to dev.prodo.live requires a developer account." />} />
        </Routes>
      );
    }
    return (
      <Routes>
        <Route path="*" element={<DevPage />} />
      </Routes>
    );
  }

  // www.prodo.live renders ONLY the public Landing Page.
  if (isWwwDomain) {
    return (
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  // Main prodo.live domain handling:
  // Bug fix: If NOT authenticated, redirect unauthenticated users to www.prodo.live (or LandingPage)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  // Authenticated user app routes
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/focus" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/dev" element={isDev ? <DevPage /> : <ForbiddenPage message="Access requires a developer account." />} />
      <Route path="/tester-review" element={<TesterReviewPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/authorize-desktop" element={<AuthorizeDesktopPage />} />
      <Route path="/punishments" element={<PunishmentsPage />} />

      {/* Main Whimsical App Views */}
      <Route path="/focus" element={<WhimsicalLayout><FocusPage /></WhimsicalLayout>} />
      <Route path="/logs" element={<WhimsicalLayout><LogsPage /></WhimsicalLayout>} />
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
