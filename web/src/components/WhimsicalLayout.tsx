import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";

/**
 * WHIMSY.
 */
const WhimsicalLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { xp, sessionTime, isTracking, startTracking, stopTracking, setIsAuthenticated, username, trackingStatus } = useFocus();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (xp < 0) {
      navigate("/punishments");
    }
  }, [xp, navigate]);

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const navItems = [
    { path: "/focus", label: "Focus", icon: "radar" },
    { path: "/logs", label: "Logs", icon: "menu_book" },
    { path: "/leaderboard", label: "Rankings", icon: "leaderboard" },
    { path: "/vault", label: "Vault", icon: "lock" },
    { path: "/friends", label: "Friends", icon: "group" },
    { path: "/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <div className="bg-[#0B0E23] dark:bg-[#0B0E23] light:bg-[#F6F8FC] text-[#E0E0FF] min-h-screen w-screen overflow-x-hidden font-sans select-none flex flex-col relative">

      {/* Top Telemetry & Header Bar */}
      <header className="sticky top-0 z-50 bg-[#1A1C3D]/80 dark:bg-[#1A1C3D]/80 light:bg-white/90 backdrop-blur-md border-b border-[#2D3261]/60 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Brand Logo */}
          <Link to="/focus" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9D72FF] to-[#00F5FF] text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="font-display font-black text-2xl tracking-tight text-white dark:text-white light:text-slate-900">
              prodo
            </span>
          </Link>

          {/* Telemetry Status Banner */}
          <div className="flex items-center gap-3">
            <div className="bg-[#1A1C3D] dark:bg-[#1A1C3D] light:bg-amber-50 border border-[#2D3261] dark:border-[#2D3261] light:border-amber-200 rounded-2xl px-4 py-1.5 flex items-center gap-3 shadow-2xs">
              <div className="w-6 h-6 rounded-xl bg-[#00F5FF]/20 text-[#00F5FF] flex items-center justify-center font-bold text-xs">
                <span className="material-symbols-outlined text-base">radar</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black tracking-wider text-[#00F5FF] uppercase">
                  TELEMETRY ACTIVE
                </span>
                <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-700">
                  Status: {isTracking ? trackingStatus : "Ready"} • Time {formatSessionTime(sessionTime)}
                </span>
              </div>
            </div>

            {/* Operator Chip */}
            <div className="flex items-center gap-2 bg-[#1A1C3D] border border-[#2D3261] rounded-full px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-[#9D72FF] text-white flex items-center justify-center text-xs font-black uppercase">
                {(username || "OP").substring(0, 2)}
              </div>
              <span className="text-xs font-extrabold text-white hidden sm:inline">
                {username || "Operator"}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Navigation Pills Bar */}
      <nav className="bg-[#1A1C3D]/60 dark:bg-[#1A1C3D]/60 light:bg-white border-b border-[#2D3261]/40 py-2.5 px-6 sticky top-[65px] z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">

          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${isActive
                    ? "bg-gradient-to-r from-[#9D72FF] to-[#00F5FF] text-white shadow-md shadow-[#9D72FF]/30 scale-[1.02]"
                    : "bg-[#1A1C3D] text-slate-300 hover:text-white border border-[#2D3261]/60"
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Quick Tracking Toggle Button */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {isTracking ? (
              <button
                onClick={stopTracking}
                className="bg-[#FF4D6D] hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md flex items-center gap-2 transition-all btn-bubbly"
              >
                <span className="material-symbols-outlined text-lg">stop</span>
                <span>Stop Session</span>
              </button>
            ) : (
              <button
                onClick={startTracking}
                className="bg-gradient-to-r from-[#9D72FF] to-[#00F5FF] text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md flex items-center gap-2 transition-all btn-bubbly"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                <span>Start Focus</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={() => {
                if (window.confirm("Confirm logout from Prodo?")) {
                  localStorage.removeItem("prodo_token");
                  setIsAuthenticated(false);
                  stopTracking();
                  navigate("/login");
                }
              }}
              className="p-2 text-slate-400 hover:text-[#FF4D6D] rounded-full transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined text-xl">power_settings_new</span>
            </button>
          </div>

        </div>
      </nav>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

    </div>
  );
};

export default WhimsicalLayout;
