import React, { useState } from "react";
import { useFocus } from "../context/FocusContext";

const FocusPage: React.FC = () => {
  const {
    xp,
    multiplier,
    trackingStatus,
    threatSeconds,
    isTracking,
    infractions,
    graceDuration,
    executeCommand,
    username,
    latestFrame,
    phoneWarning,
    dismissPhoneWarning
  } = useFocus();

  const [cmdInput, setCmdInput] = useState("");
  const [shellFeedback, setShellFeedback] = useState<string | null>(null);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;

    const feedback = executeCommand(cmdInput);
    if (feedback === "SYSTEM_SHELL_CLEAR") {
      setShellFeedback(null);
    } else {
      setShellFeedback(feedback);
    }
    setCmdInput("");
  };

  // Threat bar rendering
  const threatPercent = isTracking && trackingStatus === "DISTRACTED" 
    ? (threatSeconds / graceDuration) * 100 
    : 100;

  const activeBlocksCount = Math.ceil(threatPercent / 10);

  return (
    <div className="flex-grow flex flex-col lg:flex-row gap-6 p-4 lg:p-6 h-auto lg:h-full overflow-y-auto lg:overflow-hidden select-none relative">
      {/* Center Hero Panel */}
      <section className="flex-1 flex flex-col h-auto lg:h-full gap-6 overflow-visible lg:overflow-hidden">
        
        {/* Operator Profile & XP Header */}
        <div className="flex gap-6 h-16 flex-shrink-0">
          <div className="flex-1 bg-surface-container-lowest border border-outline-variant px-4 py-3 flex items-center justify-between">
            <span className="font-technical-prefix text-technical-prefix text-outline-variant uppercase">OPERATOR</span>
            <span className="font-log-body font-bold text-primary">{username || "LOADING..."}</span>
          </div>
          <div className="flex-1 bg-surface-container-lowest border border-outline-variant px-4 py-3 flex items-center justify-between">
            <span className="font-technical-prefix text-technical-prefix text-outline-variant uppercase">XP SCORE</span>
            <span className="font-value-lg text-[22px] text-primary">{xp.toLocaleString()} XP</span>
          </div>
        </div>

        {/* Multiplier Core Module */}
        <div className="flex-grow bg-surface-container-lowest border border-outline-variant relative flex flex-col items-center justify-center p-8 overflow-hidden">
          <div className="absolute top-4 left-4 font-technical-prefix text-technical-prefix text-outline-variant">FOCUS ENGINE</div>
          <div className="absolute top-4 right-4 font-technical-prefix text-technical-prefix text-outline-variant blink-cursor">
            {isTracking ? "CV_LINK_OK" : "CV_OFFLINE"}
          </div>

          {/* Glowing central indicator */}
          <div className={`relative w-[240px] h-[240px] border flex items-center justify-center transition-all duration-300 ${
            isTracking 
              ? trackingStatus === "DISTRACTED" 
                ? "border-crimson/30 threat-pulse" 
                : "border-amber/30 core-glow"
              : "border-outline-variant opacity-40"
          }`}>
            <div className="absolute inset-2 border border-dashed border-outline-variant opacity-30"></div>
            <div className="text-center z-10 flex flex-col items-center justify-center">
              <span className={`font-value-xl text-[80px] leading-none transition-colors duration-300 ${
                isTracking 
                  ? trackingStatus === "DISTRACTED" 
                    ? "text-crimson drop-shadow-[0_0_8px_rgba(220,20,60,0.6)]" 
                    : "text-amber drop-shadow-[0_0_8px_rgba(255,191,0,0.6)]"
                  : "text-outline"
              }`}>
                {isTracking ? `${multiplier.toFixed(1)}X` : "1.0X"}
              </span>
              <div className="font-technical-prefix text-technical-prefix text-outline-variant uppercase tracking-widest mt-4">
                {trackingStatus === "DISTRACTED" ? "THREAT DECAY ACTIVE" : "MULTIPLIER"}
              </div>
            </div>
          </div>

          {/* Threat Meter bar */}
          <div className="absolute bottom-6 w-full max-w-sm px-6">
            <div className="flex justify-between mb-2">
              <span className="font-technical-prefix text-technical-prefix text-outline-variant uppercase">THREAT METER</span>
              <span className={`font-technical-prefix text-technical-prefix ${
                trackingStatus === "DISTRACTED" ? "text-crimson" : "text-emerald"
              }`}>
                {trackingStatus === "DISTRACTED" ? `WARNING: ${threatSeconds}s` : "NOMINAL"}
              </span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest flex gap-[2px]">
              {Array.from({ length: 10 }).map((_, i) => {
                const isActive = isTracking && trackingStatus === "DISTRACTED" 
                  ? i < activeBlocksCount 
                  : true;
                return (
                  <div
                    key={i}
                    className={`h-full flex-1 transition-colors duration-200 ${
                      isActive 
                        ? trackingStatus === "DISTRACTED" 
                          ? "bg-crimson opacity-80" 
                          : "bg-emerald opacity-60"
                        : "bg-transparent border border-surface-variant opacity-10"
                    }`}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Right Side Panel */}
      <section className="w-full lg:w-[340px] flex flex-col gap-6 h-auto lg:h-full flex-shrink-0 overflow-visible lg:overflow-hidden">
        
        {/* Live Video Feed / CV Monitor (Replaces Mini Vault) */}
        <div className="flex-1 flex flex-col min-h-[220px] overflow-hidden">
          <div className="font-technical-prefix text-technical-prefix text-outline-variant uppercase mb-2 flex justify-between items-center">
            <span>LIVE FEED MONITOR</span>
            <span className={isTracking ? "text-emerald" : "text-outline-variant"}>
              {isTracking ? "LIVE" : "STANDBY"}
            </span>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant relative flex items-center justify-center flex-grow overflow-hidden min-h-[160px]">
            {latestFrame ? (
              <img src={latestFrame} alt="Live CV Feed" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-outline-variant opacity-40">
                <span className="material-symbols-outlined text-[48px]">videocam_off</span>
                <span className="font-technical-prefix text-[10px] uppercase">WEBCAM INACTIVE</span>
              </div>
            )}
            {isTracking && (
              <div className="absolute top-2 left-2 bg-background/80 px-2 py-1 border border-outline-variant text-[9px] font-technical-prefix text-emerald uppercase">
                {trackingStatus}
              </div>
            )}
          </div>
        </div>

        {/* Focus Log */}
        <div className="flex-1 flex flex-col min-h-[160px] overflow-hidden">
          <div className="font-technical-prefix text-technical-prefix text-outline-variant uppercase mb-2">FOCUS LOG</div>
          <div className="bg-surface-container-lowest border border-outline-variant p-4 flex flex-col gap-2 font-log-body text-[12px] text-outline-variant flex-grow overflow-y-auto">
            {infractions.length === 0 ? (
              <div className="opacity-40 italic">No focus breaks recorded.</div>
            ) : (
              infractions.map((inf, idx) => (
                <div key={idx} className="flex flex-col gap-1 text-crimson pb-2 border-b border-surface-variant">
                  <div className="flex justify-between opacity-70 text-[10px]">
                    <span>{inf.timestamp}</span>
                    <span>{inf.code}</span>
                  </div>
                  <div className="uppercase font-bold">{inf.name}</div>
                  <div className="opacity-80">&gt; {inf.details}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Command Line Input */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <form onSubmit={handleCommandSubmit} className="h-10 border border-outline-variant bg-surface-container-lowest flex items-center px-3">
            <span className="font-technical-prefix text-technical-prefix text-outline-variant mr-2">$_</span>
            <input
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              className="bg-transparent border-none outline-none font-technical-prefix text-[12px] text-on-surface w-full focus:ring-0 p-0 placeholder-outline-variant"
              placeholder="enter command..."
              type="text"
            />
          </form>
          {shellFeedback && (
            <div className="bg-[#141313] border border-outline-variant p-2 font-technical-prefix text-[10px] text-amber max-h-16 overflow-y-auto">
              &gt; {shellFeedback}
            </div>
          )}
        </div>
      </section>

      {/* Phone Warning Modal Overlay */}
      {phoneWarning && (
        <div className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest border-2 border-crimson p-6 max-w-sm w-full flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-[64px] text-crimson animate-pulse">smartphone</span>
            <h2 className="font-value-lg text-[24px] text-crimson uppercase">PHONE DETECTED</h2>
            <p className="font-log-body text-xs text-on-surface-variant leading-relaxed">
              Cell phone detected in camera view. Disconnect device to resume focus streak multiplier.
            </p>
            <button
              onClick={dismissPhoneWarning}
              className="w-full py-3 bg-crimson hover:bg-red-500 text-white font-technical-prefix text-xs font-bold uppercase transition-colors"
            >
              DISMISS ALARM
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusPage;
