import React from "react";
import { Link } from "react-router-dom";
import { useFocus } from "../../context/FocusContext";

/**
 * Whimsical Focus Page - Immersive Canvas Dashboard Content.
 * Features animated concentric rings with dynamic color themes:
 * - Green for FOCUSED
 * - Red for DISTRACTED
 * - Purple for UNCERTAIN / Idle
 */
const FocusPage: React.FC = () => {
  const {
    xp,
    isTracking,
    trackingStatus,
    multiplier,
    threatSeconds,
    breakTimeRemaining,
    purchaseBreakTime,
    phoneWarning,
    dismissPhoneWarning,
  } = useFocus();

  // Determine active status theme colors
  const activeStatus = isTracking ? trackingStatus : "UNCERTAIN";

  const getStatusTheme = () => {
    switch (activeStatus) {
      case "FOCUSED":
        return {
          textColor: "text-emerald-400",
          glowColor: "bg-emerald-500/25",
          borderColor: "border-emerald-500/50",
          ringBorder: "border-emerald-400/60",
          dropShadow: "drop-shadow-[0_0_30px_rgba(16,185,129,0.8)]",
          statusText: "FOCUSED",
          badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        };
      case "DISTRACTED":
        return {
          textColor: "text-rose-500",
          glowColor: "bg-rose-500/25",
          borderColor: "border-rose-500/50",
          ringBorder: "border-rose-500/60",
          dropShadow: "drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]",
          statusText: "DISTRACTED",
          badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        };
      case "UNCERTAIN":
      default:
        return {
          textColor: "text-primary",
          glowColor: "bg-primary/20",
          borderColor: "border-lavender",
          ringBorder: "border-primary/40",
          dropShadow: "drop-shadow-[0_0_30px_rgba(157,114,255,0.7)]",
          statusText: isTracking ? "UNSURE" : "READY TO FOCUS",
          badgeBg: "bg-primary/20 text-primary border-primary/40",
        };
    }
  };

  const theme = getStatusTheme();

  return (
    <div className="flex flex-col justify-between w-full h-full min-h-[calc(100vh-120px)] relative">
      
      {/* IMMERSIVE CENTRAL CORE HERO */}
      <div className="relative flex-grow flex flex-col items-center justify-center my-6">
        
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
          
          {/* Streamlined XP Balance Badge */}
          <div className="absolute left-0 top-1/4 float-anim-delayed z-20 hidden lg:block">
            <div className="bg-surface/90 backdrop-blur-xl rounded-3xl kawaii-shadow p-4 px-5 flex items-center gap-3 border border-lavender">
              <div className="w-10 h-10 bg-tertiary/20 rounded-2xl flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-xl">stars</span>
              </div>
              <div>
                <div className="font-display font-black text-xl text-on-surface">{(xp || 0).toLocaleString()} XP</div>
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

            {/* Glowing & Animated Concentric Rings */}
            <div className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center">
              
              {/* Outer Ambient Glow */}
              <div className={`absolute inset-0 rounded-full blur-3xl scale-125 transition-all duration-700 opacity-60 ${theme.glowColor}`}></div>

              {/* Ring 1: Pulsing Outer Halo */}
              <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-700 animate-pulse ${theme.borderColor}`}></div>

              {/* Ring 2: Rotating Dashed Petal Ring */}
              <div className={`absolute inset-6 rounded-full border-4 border-dashed transition-colors duration-700 animate-[spin_20s_linear_infinite] ${theme.ringBorder}`}></div>

              {/* Ring 3: Inner Breathing Ring */}
              <div className={`absolute inset-12 rounded-full border-2 transition-colors duration-700 animate-pulse ${theme.borderColor}`}></div>

              {/* Center Circle Display */}
              <div className={`absolute inset-16 md:inset-20 bg-surface rounded-full flex flex-col items-center justify-center kawaii-shadow border-4 transition-all duration-700 p-6 text-center ${theme.borderColor}`}>
                <span className={`font-display font-black text-7xl md:text-8xl transition-all duration-700 ${theme.textColor} ${theme.dropShadow} leading-none`}>
                  {multiplier.toFixed(1)}x
                </span>
                
                {/* Dynamic Status Pill */}
                <div className={`mt-3 px-4 py-1 rounded-full border text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${theme.badgeBg}`}>
                  {theme.statusText}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* BOTTOM MODULES */}
      <div className="w-full flex flex-col gap-6 pt-4">
        
        {/* Acquire Break Time Pass Card */}
        <div className="bg-surface/80 backdrop-blur-md rounded-[32px] kawaii-shadow p-5 flex flex-wrap items-center justify-between gap-4 border border-lavender/60 w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center font-black text-2xl">
              <span className="material-symbols-outlined text-2xl">coffee</span>
            </div>
            <div>
              <div className="font-extrabold text-sm text-on-surface">Acquire Break Time Pass</div>
              <div className="text-xs font-semibold text-on-surface/60 mt-0.5">
                {breakTimeRemaining > 0 ? (
                  <span className="text-secondary font-black animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    BREAK PASS ACTIVE: {Math.floor(breakTimeRemaining / 60)}m {breakTimeRemaining % 60}s remaining
                  </span>
                ) : (
                  "Pause telemetry monitoring for 5 minutes without penalty (50 XP)"
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => purchaseBreakTime(300)}
              disabled={xp < 50}
              className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
                xp >= 50
                  ? "bg-secondary text-background hover:scale-105 kawaii-shadow"
                  : "bg-surface/50 text-on-surface/30 border border-lavender/50 cursor-not-allowed"
              }`}
            >
              +5 MIN PASS (50 XP)
            </button>
            <Link
              to="/vault"
              className="px-4 py-2.5 rounded-full bg-surface hover:bg-lavender/50 text-on-surface font-extrabold text-xs border border-lavender/60 flex items-center gap-1 transition-colors"
            >
              <span>Vault</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Anchored Focus Threat / Health Bar */}
        <div className="w-full mx-auto">
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
