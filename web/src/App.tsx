import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FocusProvider } from "./context/FocusContext";
import Layout from "./components/Layout";
import FocusPage from "./pages/FocusPage";
import LogsPage from "./pages/LogsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import VaultPage from "./pages/VaultPage";
import ConfigPage from "./pages/ConfigPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import HelpPage from "./pages/HelpPage";
import NotFoundPage from "./pages/NotFoundPage";
import FriendsPage from "./pages/FriendsPage";

function App() {
  return (
    <FocusProvider>
      <Router>
        <Routes>
          {/* Default Gateway redirects to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Standalone Authentication Screen */}
          <Route path="/login" element={<LoginPage />} />

          {/* Core HUD views nested in layout frame */}
          <Route path="/focus" element={<Layout><FocusPage /></Layout>} />
          <Route path="/logs" element={<Layout><LogsPage /></Layout>} />
          <Route path="/leaderboard" element={<Layout><LeaderboardPage /></Layout>} />
          <Route path="/vault" element={<Layout><VaultPage /></Layout>} />
          <Route path="/friends" element={<Layout><FriendsPage /></Layout>} />
          <Route path="/config" element={<Layout><ConfigPage /></Layout>} />
          <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
          <Route path="/help" element={<Layout><HelpPage /></Layout>} />

          {/* 404 Routing Exceptions */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </FocusProvider>
  );
}

export default App;

