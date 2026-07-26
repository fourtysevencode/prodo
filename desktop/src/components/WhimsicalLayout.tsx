import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";

/**
 * WhimsicalLayout - The new global layout wrapping all pages.
 * Incorporates the dark aesthetic, floating sidebars, and top header.
 */
const WhimsicalLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const {
    xp,
    sessionTime,
    isTracking,
    trackingStatus,
    startTracking,
    stopTracking,
    setIsAuthenticated,
  } = useFocus();

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
    { path: "/leaderboard", label: "Rankings", icon: "leaderboard" },
    { path: "/vault", label: "Vault", icon: "lock" },
    { path: "/friends", label: "Friends", icon: "group" },
    { path: "/settings", label: "Settings", icon: "settings" },
  ];

  const getHeaderStatusColor = () => {
    if (!isTracking) return "text-primary";
    if (trackingStatus === "FOCUSED") return "text-emerald-400 font-extrabold";
    if (trackingStatus === "DISTRACTED") return "text-rose-500 font-extrabold animate-pulse";
    return "text-primary";
  };

  return (
    <div className="bg-background text-on-surface min-h-screen w-screen overflow-x-hidden font-sans relative flex flex-col select-none">
      
      {/* Background Floating Decorative Vectors */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0 overflow-hidden">
        <span className="material-symbols-outlined text-[140px] absolute top-1/4 left-1/4 text-primary float-anim">cloud</span>
        <span className="material-symbols-outlined text-[110px] absolute bottom-1/4 right-1/4 text-secondary float-anim-delayed">auto_awesome</span>
        <span className="material-symbols-outlined text-[70px] absolute top-20 right-1/3 text-accent float-anim">flare</span>
      </div>

      {/* Top Header Bar */}
      <header className="flex justify-between items-center px-8 py-4 w-full bg-transparent z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/focus" className="flex items-center gap-3 hover:scale-105 transition-transform">
            <img src="/favicon.svg" alt="Prodo Logo" className="w-10 h-10 rounded-2xl shadow-lg kawaii-shadow" />
            <span className="font-display font-black text-on-surface text-2xl tracking-tight">Prodo Focus</span>
          </Link>
          <div className="hidden md:flex items-center ml-8 gap-6 text-sm font-semibold text-on-surface/70">
            <span className={`flex items-center gap-1.5 ${getHeaderStatusColor()}`}>
              <span className="material-symbols-outlined text-[18px]">radar</span>
              Status: {isTracking ? trackingStatus : "Ready"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
              Session: {formatSessionTime(sessionTime)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm("Confirm logout from Prodo?")) {
                localStorage.removeItem("prodo_token");
                setIsAuthenticated(false);
                stopTracking();
                navigate("/login");
              }
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-lavender/50 text-on-surface hover:bg-heart-red hover:text-white transition-all"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[20px]">power_settings_new</span>
          </button>
        </div>
      </header>

      {/* Left Floating Nav Bubble Sidebar */}
      <aside className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-40">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all group border ${
                isActive
                  ? "bg-primary text-white kawaii-shadow border-primary scale-110"
                  : "bg-surface/80 backdrop-blur-md text-on-surface/50 hover:text-primary border-lavender hover:scale-105"
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            </Link>
          );
        })}
      </aside>

      {/* Right Floating Start/Stop Action Bubble */}
      <aside className="fixed right-8 top-1/2 -translate-y-1/2 z-40">
        {isTracking ? (
          <button
            onClick={stopTracking}
            className="w-20 h-20 bg-heart-red text-white rounded-full flex flex-col items-center justify-center kawaii-shadow btn-bubbly border-4 border-surface"
            title="Stop Focus Session"
          >
            <span className="material-symbols-outlined text-[36px]">stop</span>
            <span className="text-[9px] font-black uppercase">STOP</span>
          </button>
        ) : (
          <button
            onClick={startTracking}
            className="w-20 h-20 bg-secondary text-background rounded-full flex flex-col items-center justify-center kawaii-shadow btn-bubbly border-4 border-surface"
            title="Start Focus Session"
          >
            <span className="material-symbols-outlined text-[38px] fill-1">play_arrow</span>
            <span className="text-[9px] font-black uppercase tracking-wider">START</span>
          </button>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="relative flex-grow flex flex-col z-10 w-full pl-28 pr-32 pb-8">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>

    </div>
  );
};

export default WhimsicalLayout;
