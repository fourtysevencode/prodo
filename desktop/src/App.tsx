import { HashRouter as Router, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <FocusProvider>
      <Router>
        <Routes>
          {/* Default Landing Page for prodo.live */}
          <Route path="/" element={<LandingPage />} />
          
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
      </Router>
    </FocusProvider>
  );
}

export default App;
