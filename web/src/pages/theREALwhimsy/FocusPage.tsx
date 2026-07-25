import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useFocus } from "../../context/FocusContext";

/**
 * Whimsical Focus Page - Immersive Canvas Dashboard Content.
 * Layout is now handled by WhimsicalLayout.tsx.
 */
const FocusPage: React.FC = () => {
  const {
    xp,
    isTracking,
    trackingStatus,
    multiplier,
    coreTemp,
    threatSeconds,
    systemLogs,
    vaultItems,
    purchaseApp,
    executeCommand,
    phoneWarning,
    dismissPhoneWarning,
  } = useFocus();

  const [commandInput, setCommandInput] = useState("");
  const [commandOutput, setCommandOutput] = useState<string | null>(null);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const res = executeCommand(commandInput);
    setCommandOutput(res);
    setCommandInput("");
    setTimeout(() => setCommandOutput(null), 4000);
  };

  return (
    <div className="flex flex-col justify-between w-full h-full min-h-[calc(100vh-100px)]">
      
      {/* IMMERSIVE CENTRAL CORE HERO */}
      <div className="relative flex-grow flex flex-col items-center justify-center mt-4">
        
        {/* Phone Distraction Banner Modal */}
        {phoneWarning && (
          <div className="absolute top-0 z-50 bg-heart-red/20 border-2 border-heart-red text-white rounded-3xl p-4 px-6 flex items-center gap-4 backdrop-blur-xl kawaii-shadow animate-bounce">
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
          <div className="absolute left-0 top-1/4 float-anim-delayed z-20 hidden lg:block">
            <div className="bg-surface/90 backdrop-blur-xl rounded-3xl kawaii-shadow p-5 flex items-center gap-4 border border-lavender w-64">
              <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">stars</span>
              </div>
              <div>
                <div className="text-[10px] font-bold text-on-surface/50 uppercase tracking-widest">Focus Balance</div>
                <div className="font-display font-black text-2xl text-on-surface">{(xp || 0).toLocaleString()} XP</div>
              </div>
            </div>
          </div>

          {/* Floating Right Stat Card: Core Temp */}
          <div className="absolute right-0 bottom-1/4 float-anim z-20 hidden lg:block">
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
      </div>

      {/* BOTTOM HORIZONTAL MODULES */}
      <div className="w-full flex flex-col gap-4 pt-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* System Logs Feed (Growth Journal Equivalent) */}
          <div className="lg:col-span-2 flex flex-col">
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
        <div className="w-full mx-auto mt-2">
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

      </div>

    </div>
  );
};

export default FocusPage;
