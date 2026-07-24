import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";

/**
 * WhimsicalLayout - Modern, cheerful light-themed application wrapper for beta.prodo.live.
 * Inspired by friendly, high-contrast UI design with soft rounded shapes, high readability,
 * vibrant royal blue buttons, and clean telemetry indicators.
 */
const WhimsicalLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { xp, sessionTime, isTracking, startTracking, stopTracking, setIsAuthenticated, username, trackingStatus } = useFocus();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to punishments if XP falls below zero
  useEffect(() => {
    if (xp < 0) {
      navigate("/punishments");
    }
  }, [xp, navigate]);

  // Formats active session seconds into friendly MM:SS string
  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const navItems = [
    { path: "/beta/focus", label: "Focus", icon: "radar" },
    { path: "/beta/logs", label: "Logs", icon: "receipt_long" },
    { path: "/beta/leaderboard", label: "Rankings", icon: "leaderboard" },
    { path: "/beta/vault", label: "Vault", icon: "lock" },
    { path: "/beta/friends", label: "Friends", icon: "group" },
    { path: "/beta/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <div className="bg-[#F6F8FC] text-slate-800 min-h-screen w-screen overflow-x-hidden font-sans select-none flex flex-col">
      
      {/* Top Bar Navigation & Telemetry Banner */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand Logo & Beta Tag */}
          <div className="flex items-center gap-3">
            <Link to="/beta/focus" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0047AB] to-[#0256D0] text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                P
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 group-hover:text-[#0047AB] transition-colors">
                prodo
              </span>
            </Link>
            <span className="bg-blue-100 text-[#0047AB] text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-blue-200">
              BETA
            </span>
          </div>

          {/* Search Bar - Whimsical Pill Design */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <div className="relative flex items-center w-full">
              <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-xl pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Search focus metrics, friends, history..."
                className="w-full bg-slate-100/80 border border-slate-200/80 rounded-full pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 focus:bg-white focus:border-[#0047AB] transition-all"
              />
            </div>
          </div>

          {/* Telemetry Header Pill - Matching Reference Telemetry Banner Style */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                <span className="material-symbols-outlined text-base">warning</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-extrabold tracking-wider text-amber-800 uppercase">
                  FOCUS & AI TELEMETRY
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  Status: {isTracking ? trackingStatus : "Ready"} • Time {formatSessionTime(sessionTime)}
                </span>
              </div>
            </div>

            {/* Operator Profile Chip */}
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/70 rounded-full px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-bold uppercase">
                {(username || "OP").substring(0, 2)}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden sm:inline">
                {username || "Operator"}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Navigation Pills Bar */}
      <nav className="bg-white border-b border-slate-200/60 py-3 px-6 shadow-2xs sticky top-[65px] z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          
          <div className="flex items-center gap-2 py-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === "/beta/focus" && location.pathname === "/beta");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#0047AB] text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                      : "bg-slate-100/90 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-200/50"
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
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">stop</span>
                <span>Stop Session</span>
              </button>
            ) : (
              <button
                onClick={startTracking}
                className="bg-[#0047AB] hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                <span>Start Focus</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={() => {
                if (window.confirm("Confirm logout from Prodo Beta?")) {
                  localStorage.removeItem("prodo_token");
                  setIsAuthenticated(false);
                  stopTracking();
                  navigate("/login");
                }
              }}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined text-xl">power_settings_new</span>
            </button>
          </div>

        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

    </div>
  );
};

export default WhimsicalLayout;
