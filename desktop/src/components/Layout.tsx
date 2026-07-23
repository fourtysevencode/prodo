import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { xp, sessionTime, isTracking, startTracking, stopTracking, setIsAuthenticated, username } = useFocus();
  const location = useLocation();
  const navigate = useNavigate();

  // Lockdown Redirect if XP drops below zero
  useEffect(() => {
    if (xp < 0) {
      navigate("/punishments");
    }
  }, [xp, navigate]);

  // Helper to format session time into MM:SS
  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const navItems = [
    { path: "/focus", label: "FOCUS", icon: "radar" },
    { path: "/logs", label: "LOGS", icon: "receipt_long" },
    { path: "/leaderboard", label: "RANKINGS", icon: "leaderboard" },
    { path: "/vault", label: "VAULT", icon: "lock" },
    { path: "/friends", label: "FRIENDS", icon: "group" },
    { path: "/settings", label: "SETTINGS", icon: "settings" },
  ];

  return (
    <div className="bg-[#0A0A0A] text-on-surface h-screen w-screen overflow-hidden font-log-body relative flex flex-col select-none">
      
      {/* TopNavBar */}
      <header className="flex justify-between items-center px-6 w-full h-10 bg-background border-b border-outline-variant z-50 flex-shrink-0">
        {/* Left: Active/Inactive status indicator */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isTracking ? "bg-emerald animate-pulse" : "bg-outline-variant"}`}></span>
          <span className={`font-technical-prefix text-[10px] uppercase font-bold tracking-widest ${isTracking ? "text-emerald" : "text-outline-variant"}`}>
            {isTracking ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>

        {/* Center: PRODO App Name with BETA Footer */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-baseline gap-1 relative">
          <span className="font-value-lg text-[20px] text-primary tracking-widest uppercase">PRODO</span>
          <span className="font-technical-prefix text-[8px] text-amber uppercase font-bold tracking-wider relative top-[2px]">BETA</span>
        </div>

        {/* Right: Time Active Counter */}
        <div className="flex items-center gap-2 font-technical-prefix text-[11px] text-outline-variant">
          <span className="uppercase text-[9px] tracking-wider opacity-60">TIME ACTIVE</span>
          <span className="font-bold text-primary">{formatSessionTime(sessionTime)}</span>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex w-full h-[calc(100vh-40px)] overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-16 md:w-20 h-full border-r border-outline-variant bg-surface-container-lowest flex flex-col items-center py-4 z-40 flex-shrink-0">
          
          {/* Logo Header */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <img src="/favicon.svg" alt="Prodo Logo" className="w-8 h-8 hover:scale-105 transition-transform" />
            <div className="text-center hidden md:block">
              <div className="font-technical-prefix text-[8px] text-outline-variant truncate max-w-[70px]" title={username || "OPERATOR"}>
                {username || "OPERATOR"}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 w-full px-2 flex-grow overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-1 py-3 border-l-4 transition-all group ${
                    isActive 
                      ? "text-primary bg-surface-container-highest border-primary" 
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high border-transparent"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="font-technical-prefix text-[8px] uppercase hidden md:block">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Operations */}
          <div className="mt-auto flex flex-col items-center w-full gap-4 px-2">
            <button
              onClick={() => {
                if (window.confirm("Confirm logout from Prodo?")) {
                  localStorage.removeItem("prodo_token");
                  setIsAuthenticated(false);
                  stopTracking();
                  navigate("/login");
                }
              }}
              className="flex flex-col items-center justify-center gap-1 py-2 text-on-surface-variant hover:text-crimson transition-all group w-full"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                power_settings_new
              </span>
              <span className="font-technical-prefix text-[8px] uppercase hidden md:block">LOGOUT</span>
            </button>

            {/* Tracking Toggle Action */}
            {isTracking ? (
              <button
                onClick={stopTracking}
                className="w-full bg-crimson text-white font-technical-prefix text-technical-prefix font-bold uppercase py-4 hover:bg-red-500 transition-colors btn-tactical flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[24px]">stop</span>
              </button>
            ) : (
              <button
                onClick={startTracking}
                className="w-full bg-emerald text-background font-technical-prefix text-technical-prefix font-bold uppercase py-4 hover:bg-green-400 transition-colors btn-tactical flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[24px]">play_arrow</span>
              </button>
            )}
          </div>
        </aside>

        {/* Dynamic Pages Render */}
        <div className="flex-grow h-full overflow-hidden">
          {children}
        </div>

      </div>
    </div>
  );
};

export default Layout;
