import React from "react";
import { Link } from "react-router-dom";
import { useFocus } from "../context/FocusContext";

/**
 * Focus Page - Immersive Canvas Dashboard Content.
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
          borderColor: "border-outline-variant",
          ringBorder: "border-primary/40",
          dropShadow: "drop-shadow-[0_0_30px_rgba(157,114,255,0.7)]",
          statusText: isTracking ? "UNSURE" : "READY TO FOCUS",
          badgeBg: "bg-primary/20 text-primary border-primary/40",
        };
    }
  };

  const theme = getStatusTheme();

  return (
    <div className="flex flex-col justify-between w-full h-full min-h-[calc(100vh-100px)] p-6 relative overflow-y-auto select-none">
      
      {/* IMMERSIVE CENTRAL CORE HERO */}
      <div className="relative flex-grow flex flex-col items-center justify-center my-6">
        
        {/* Phone Distraction Banner Modal */}
        {phoneWarning && (
          <div className="absolute top-0 z-50 bg-crimson/20 border-2 border-crimson text-white rounded-3xl p-4 px-6 flex items-center gap-4 backdrop-blur-xl animate-bounce">
            <span className="material-symbols-outlined text-crimson text-3xl">smartphone</span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-crimson">Phone Distraction Detected</div>
              <div className="text-xs font-semibold">Please put away mobile devices to maintain streak.</div>
            </div>
            <button
              onClick={dismissPhoneWarning}
              className="px-4 py-1.5 bg-crimson text-white text-xs font-extrabold rounded-full hover:scale-105 transition-transform"
            >
              DISMISS
            </button>
          </div>
        )}

        <div className="relative w-full max-w-4xl flex items-center justify-center min-h-[380px]">
          
          {/* Streamlined XP Balance Badge */}
          <div className="absolute left-0 top-1/4 z-20 hidden lg:block">
            <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-3xl p-4 px-5 flex items-center gap-3 border border-outline-variant">
              <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-xl">stars</span>
              </div>
              <div>
                <div className="font-log-body font-bold text-xl text-primary">{(xp || 0).toLocaleString()} XP</div>
              </div>
            </div>
          </div>

          {/* CENTRAL MULTIPLIER CORE ELEMENT */}
          <div className="relative z-10 flex flex-col items-center">
            
            <div className="text-center mb-4">
              <h2 className="font-technical-prefix text-outline-variant/60 uppercase tracking-[0.4em] text-xs">
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
              <div className={`absolute inset-16 md:inset-20 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center border-4 transition-all duration-700 p-6 text-center ${theme.borderColor}`}>
                <span className={`font-value-xl text-7xl md:text-8xl transition-all duration-700 ${theme.textColor} ${theme.dropShadow} leading-none`}>
                  {multiplier.toFixed(1)}x
                </span>
                
                {/* Dynamic Status Pill */}
                <div className={`mt-3 px-4 py-1 rounded-full border text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-500 ${theme.badgeBg}`}>
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
        <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-[32px] p-5 flex flex-wrap items-center justify-between gap-4 border border-outline-variant/60 w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber/20 text-amber flex items-center justify-center font-bold text-2xl">
              <span className="material-symbols-outlined text-2xl">coffee</span>
            </div>
            <div>
              <div className="font-log-body font-bold text-sm text-primary">Acquire Break Time Pass</div>
              <div className="text-xs font-semibold text-outline-variant mt-0.5">
                {breakTimeRemaining > 0 ? (
                  <span className="text-amber font-bold animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber"></span>
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
              className={`px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
                xp >= 50
                  ? "bg-amber text-background hover:scale-105"
                  : "bg-surface-container-high text-outline-variant/30 border border-outline-variant/50 cursor-not-allowed"
              }`}
            >
              +5 MIN PASS (50 XP)
            </button>

            <Link
              to="/vault"
              className="px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-surface-container-high text-primary hover:bg-surface-container-highest transition-all"
            >
              More Passes in Vault
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default FocusPage;
