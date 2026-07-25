import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useFocus } from "../../context/FocusContext";

/**
 * Whimsical Focus Page - Immersive Canvas Dashboard.
 * Recreates the exact layout from stitch_tactical_focus_combat_hud/code.html:
 * - Floating sidebars (Left avatar & nav icons, Right bubbly play/stop action button)
 * - Central Core Hero ring displaying Multiplier (e.g. 4.5x), floating stats cards & command input
 * - Bottom horizontal System Logs journal, App Vault perks, and anchored streak health bar.
 */
const FocusPage: React.FC = () => {
  const {
    xp,
    sessionTime,
    isTracking,
    trackingStatus,
    multiplier,
    coreTemp,
    threatSeconds,
    startTracking,
    stopTracking,
    systemLogs,
    vaultItems,
    purchaseApp,
    executeCommand,
    username,
    phoneWarning,
    dismissPhoneWarning,
  } = useFocus();

  const [commandInput, setCommandInput] = useState("");
  const [commandOutput, setCommandOutput] = useState<string | null>(null);

  const location = useLocation();

  // Navigation Items matching the left vertical bubble bar
  const navItems = [
    { path: "/focus", label: "Focus", icon: "radar" },
    { path: "/logs", label: "Logs", icon: "menu_book" },
    { path: "/leaderboard", label: "Rankings", icon: "leaderboard" },
    { path: "/vault", label: "Vault", icon: "lock" },
    { path: "/friends", label: "Friends", icon: "group" },
    { path: "/settings", label: "Settings", icon: "settings" },
  ];

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const res = executeCommand(commandInput);
    setCommandOutput(res);
    setCommandInput("");
    setTimeout(() => setCommandOutput(null), 4000);
  };

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-background text-on-surface min-h-screen w-screen overflow-x-hidden font-sans relative flex flex-col justify-between select-none">
      
      {/* Background Floating Decorative Vectors */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
        <span className="material-symbols-outlined text-[140px] absolute top-1/4 left-1/4 text-primary float-anim">cloud</span>
        <span className="material-symbols-outlined text-[110px] absolute bottom-1/4 right-1/4 text-secondary float-anim-delayed">auto_awesome</span>
        <span className="material-symbols-outlined text-[70px] absolute top-20 right-1/3 text-accent float-anim">flare</span>
      </div>

      {/* Top Header Bar */}
      <header className="flex justify-between items-center px-8 py-4 w-full bg-transparent z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center font-black text-xl shadow-lg kawaii-shadow">
              P
            </div>
            <span className="font-display font-black text-on-surface text-2xl tracking-tight">Prodo Focus</span>
          </div>
          <div className="hidden md:flex items-center ml-8 gap-6 text-sm font-semibold text-on-surface/70">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">radar</span>
              Status: {isTracking ? trackingStatus : "Ready"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
              Session: {formatSessionTime(sessionTime)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/settings" className="w-10 h-10 flex items-center justify-center rounded-full bg-lavender/50 text-on-surface hover:bg-lavender transition-all">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </Link>
        </div>
      </header>

      {/* Left Floating Nav Bubble Sidebar */}
      <aside className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-40">
        {/* User Profile Avatar Bubble */}
        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center kawaii-shadow border-4 border-surface overflow-hidden mb-2">
          <span className="font-display font-black text-white text-lg uppercase">
            {(username || "OP").substring(0, 2)}
          </span>
        </div>

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

      {/* IMMERSIVE CENTRAL CORE HERO */}
      <main className="relative flex-grow flex flex-col items-center justify-center px-10 my-4 z-10">
        
        {/* Phone Distraction Banner Modal */}
        {phoneWarning && (
          <div className="absolute top-2 z-50 bg-heart-red/20 border-2 border-heart-red text-white rounded-3xl p-4 px-6 flex items-center gap-4 backdrop-blur-xl kawaii-shadow animate-bounce">
            <span className="material-symbols-outlined text-heart-red text-3xl">smartphone</span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-heart-red">Phone Distraction Detected</div>
              <div className="text-xs font-semibold">Please put away mobile devices to maintain streak.</div>
            </div>
            <button
              onClick={dismissPhoneWarning}
              className="px-4 py-1.5 bg-heart-red text-white text-xs font-extrabold rounded-full hover:scale-105 transition-transform"
            >
              DISMISS
            </button>
          </div>
        )}

        <div className="relative w-full max-w-4xl flex items-center justify-center min-h-[380px]">
          
          {/* Floating Left Stat Card: XP Balance */}
          <div className="absolute left-4 top-1/4 float-anim-delayed z-20 hidden lg:block">
            <div className="bg-surface/90 backdrop-blur-xl rounded-3xl kawaii-shadow p-5 flex items-center gap-4 border border-lavender w-64">
              <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">stars</span>
              </div>
              <div>
                <div className="text-[10px] font-bold text-on-surface/50 uppercase tracking-widest">Focus Balance</div>
                <div className="font-display font-black text-2xl text-on-surface">{xp.toLocaleString()} XP</div>
              </div>
            </div>
          </div>

          {/* Floating Right Stat Card: Core Temp */}
          <div className="absolute right-4 bottom-1/4 float-anim z-20 hidden lg:block">
            <div className="bg-surface/90 backdrop-blur-xl rounded-3xl kawaii-shadow p-5 flex items-center gap-4 border border-lavender w-64">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-2xl">thermostat</span>
              </div>
              <div>
                <div className="text-[10px] font-bold text-on-surface/50 uppercase tracking-widest">Core Temp</div>
                <div className="font-display font-black text-2xl text-primary">{coreTemp}°C Nominal</div>
              </div>
            </div>
          </div>

          {/* CENTRAL MULTIPLIER CORE ELEMENT */}
          <div className="relative z-10 flex flex-col items-center">
            
            <div className="text-center mb-4">
              <h2 className="font-display font-black text-on-surface/50 uppercase tracking-[0.4em] text-xs">
                Active Focus Multiplier
              </h2>
            </div>

            {/* Glowing Petal / Multiplier Rings */}
            <div className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 rounded-full bloom-glow scale-125 blur-3xl opacity-50"></div>
              <div className="absolute inset-0 bg-primary/20 rounded-full bloom-glow"></div>
              <div className="absolute inset-6 bg-primary/30 rounded-full border border-primary/20"></div>
              <div className="absolute inset-12 bg-primary/40 rounded-full"></div>

              {/* Center Circle Display */}
              <div className="absolute inset-16 md:inset-20 bg-surface rounded-full flex flex-col items-center justify-center kawaii-shadow border-8 border-lavender p-6 text-center">
                <span className="font-display font-black text-7xl md:text-8xl text-primary drop-shadow-[0_0_25px_rgba(157,114,255,0.7)] leading-none">
                  {multiplier.toFixed(1)}x
                </span>
                <div className="font-bold text-on-surface/60 text-xs mt-3 uppercase tracking-[0.3em]">
                  {isTracking ? trackingStatus : "Ready to Focus"}
                </div>
              </div>
            </div>

            {/* Floating Terminal Command Bar */}
            <form onSubmit={handleCommandSubmit} className="mt-8 w-80 md:w-96 h-14 bg-surface/80 backdrop-blur-md rounded-full kawaii-shadow flex items-center px-6 border-2 border-lavender relative">
              <span className="material-symbols-outlined text-primary text-[20px] mr-3">terminal</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Enter command (e.g. status, clear)..."
                className="bg-transparent border-none outline-none font-bold text-xs text-on-surface w-full focus:ring-0 p-0 placeholder-on-surface/40"
              />
              {commandOutput && (
                <div className="absolute left-0 -bottom-10 w-full text-center bg-surface border border-primary/40 rounded-full py-1 text-[11px] font-mono text-secondary">
                  {commandOutput}
                </div>
              )}
            </form>

          </div>

        </div>
      </main>

      {/* BOTTOM HORIZONTAL MODULES */}
      <footer className="w-full flex flex-col gap-4 px-8 pb-6 pt-0 z-50 max-w-7xl mx-auto flex-shrink-0">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* System Logs Feed (Growth Journal Equivalent) */}
          <div className="md:col-span-2 flex flex-col">
            <div className="font-display font-black text-on-surface/50 uppercase text-[10px] tracking-widest mb-2 ml-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">receipt_long</span> System Logs Feed
            </div>
            <div className="bg-surface/60 backdrop-blur-md rounded-[32px] kawaii-shadow p-4 flex gap-4 overflow-x-auto border border-lavender no-scrollbar">
              {systemLogs.map((log, idx) => (
                <div key={idx} className="min-w-[260px] flex gap-3 p-3.5 rounded-2xl bg-lavender/40 border border-lavender/30 flex-shrink-0 items-center">
                  <span className="material-symbols-outlined text-secondary text-[20px]">info</span>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-[9px] font-bold text-secondary/70 uppercase">{log.timestamp} • {log.code}</div>
                    <p className="text-xs font-semibold text-on-surface truncate">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* App Vault Quick Perks */}
          <div className="flex flex-col">
            <div className="font-display font-black text-on-surface/50 uppercase text-[10px] tracking-widest mb-2 ml-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">redeem</span> Quick Perks Vault
            </div>
            <div className="bg-surface/60 backdrop-blur-md rounded-[32px] kawaii-shadow p-3 flex gap-3 border border-lavender overflow-hidden">
              <div className="flex-grow grid grid-cols-2 gap-2 h-full">
                {vaultItems.slice(0, 2).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => purchaseApp(item.id)}
                    disabled={item.unlocked || xp < item.cost}
                    className={`rounded-2xl flex flex-col items-center justify-center p-2 border-2 transition-all ${
                      item.unlocked
                        ? "bg-secondary/20 border-secondary text-secondary"
                        : "bg-lavender/40 border-dashed border-primary/30 hover:border-primary text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px] mb-1">{item.icon}</span>
                    <div className="px-2 py-0.5 bg-background rounded-full text-[8px] font-bold text-primary border border-primary/20">
                      {item.unlocked ? "UNLOCKED" : `${item.cost} XP`}
                    </div>
                  </button>
                ))}
              </div>
              <Link
                to="/vault"
                className="w-1/3 bg-gradient-to-br from-tertiary to-lavender rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-primary/30 kawaii-shadow btn-bubbly"
              >
                <span className="material-symbols-outlined text-secondary text-2xl mb-1">storefront</span>
                <span className="font-display font-black text-xs text-white uppercase">Vault</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Anchored Focus Threat / Health Bar */}
        <div className="w-full max-w-2xl mx-auto mt-2">
          <div className="flex justify-between items-center mb-1.5 px-2">
            <span className="text-[10px] font-bold text-on-surface/60 uppercase tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-heart-red">shield</span> Threat Buffer Margin
            </span>
            <span className="text-[10px] font-black text-secondary uppercase drop-shadow-[0_0_8px_rgba(0,245,255,0.4)]">
              {threatSeconds}s Remaining
            </span>
          </div>
          <div className="h-4 w-full bg-lavender rounded-full p-0.5 overflow-hidden border border-primary/20">
            <div
              className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,245,255,0.3)]"
              style={{ width: `${(threatSeconds / 15) * 100}%` }}
            ></div>
          </div>
        </div>

      </footer>

    </div>
  );
};

export default FocusPage;
