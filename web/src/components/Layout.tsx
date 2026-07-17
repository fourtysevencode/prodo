import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { xp, netLink, sessionTime, isTracking, startTracking, stopTracking } = useFocus();
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
    { path: "/config", label: "CONFIG", icon: "settings_input_component" },
    { path: "/help", label: "HELP", icon: "help" },
    { path: "/settings", label: "SETTINGS", icon: "settings" },
  ];

  return (
    <div className="bg-[#0A0A0A] text-on-surface h-screen w-screen overflow-hidden font-log-body relative flex flex-col select-none">
      
      {/* TopNavBar */}
      <header className="flex justify-between items-center px-container-padding w-full h-8 bg-background border-b border-outline-variant z-50 flex-shrink-0">
        <div className="flex items-center gap-4 h-full">
          <span className="font-technical-prefix text-technical-prefix text-primary uppercase tracking-widest">
            PRODO_NEURAL_NET_V2.0
          </span>
          <nav className="hidden md:flex h-full border-l border-outline-variant ml-2 pl-2">
            <span className="h-full px-4 flex items-center font-technical-prefix text-technical-prefix text-outline-variant">
              NET_LINK: {isTracking ? `${netLink}%` : "OFFLINE"}
            </span>
            <span className="h-full px-4 flex items-center font-technical-prefix text-technical-prefix text-outline-variant">
              SYS_TIME: {formatSessionTime(sessionTime)}
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/settings" className="text-on-surface-variant hover:text-primary transition-colors p-1 flex items-center">
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </Link>
          <button 
            onClick={() => navigate("/login")} 
            className="text-on-surface-variant hover:text-primary transition-colors p-1 flex items-center"
            title="Authenticate"
          >
            <span className="material-symbols-outlined text-[18px]">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex w-full h-[calc(100vh-32px)] overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-16 md:w-20 h-full border-r border-outline-variant bg-surface-container-lowest flex flex-col items-center py-gutter z-40 flex-shrink-0">
          {/* Operator Node Status */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-surface-variant flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined text-outline">admin_panel_settings</span>
            </div>
            <div className="text-center hidden md:block">
              <div className="font-technical-prefix text-[8px] text-outline-variant">SYS_OP_01</div>
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
                if (window.confirm("Confirm termination of Prodo HUD Core Session?")) {
                  stopTracking();
                  navigate("/login");
                }
              }}
              className="flex flex-col items-center justify-center gap-1 py-2 text-on-surface-variant hover:text-crimson transition-all group w-full"
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
