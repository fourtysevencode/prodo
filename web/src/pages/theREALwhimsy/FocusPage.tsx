import React from "react";
import { useFocus } from "../../context/FocusContext";

/**
 * WhimsicalFocusPage - Main focus tracking dashboard for beta.prodo.live.
 * Implements a bright, high-contrast UI aesthetic inspired by friendly card layouts,
 * numbered status badges, bold royal blue action buttons, and live AI vision telemetry.
 */
const WhimsicalFocusPage: React.FC = () => {
  const {
    xp,
    sessionTime,
    isTracking,
    trackingStatus,
    threatSeconds,
    multiplier,
    startTracking,
    stopTracking,
    latestFrame,
    camLoading,
    camErr,
    phoneWarning,
    dismissPhoneWarning,
  } = useFocus();

  // Format session time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Sample focus refuge / session presets matching the reference layout
  const sessionPresets = [
    {
      id: 1,
      title: "ZONE 1 (13.20, 77.78) PUBLIC FOCUS ROOM",
      subtitle: "Grand Boulevard • Primary Workspace",
      duration: "25 MIN",
      status: "DEEP FLOW",
      statusColor: "text-[#0047AB]",
      elevation: "23M ELEVATION",
      distance: "0.4 KM DISTANCE",
      score: 98,
      active: isTracking,
    },
    {
      id: 2,
      title: "ZONE 2 (13.20, 77.78) CENTRAL LIBRARY HAVEN",
      subtitle: "Civic Plaza • Quiet Reading Pod",
      duration: "45 MIN",
      status: "MODERATE",
      statusColor: "text-amber-600",
      elevation: "23M ELEVATION",
      distance: "0.5 KM DISTANCE",
      score: 85,
      active: false,
    },
    {
      id: 3,
      title: "ZONE 3 (13.20, 77.78) SILENT LAB",
      subtitle: "Research Complex • Level 4",
      duration: "60 MIN",
      status: "STRICT FOCUS",
      statusColor: "text-emerald-600",
      elevation: "28M ELEVATION",
      distance: "0.8 KM DISTANCE",
      score: 92,
      active: false,
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* Phone Warning Alert Banner */}
      {phoneWarning && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-900 rounded-3xl p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600 text-3xl">smartphone</span>
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider">Phone Distraction Detected</h4>
              <p className="text-xs font-medium text-rose-700">Please put away mobile devices to maintain focus streak.</p>
            </div>
          </div>
          <button
            onClick={dismissPhoneWarning}
            className="bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-rose-700 transition-colors"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Top Banner & Quick Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Active Focus Counter */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">ACTIVE SESSION TIME</span>
          <div className="text-4xl font-extrabold text-[#0047AB] tracking-tight my-2">
            {formatTime(sessionTime)}
          </div>
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time tracking
          </span>
        </div>

        {/* Focus Balance (XP) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">FOCUS BALANCE (XP)</span>
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight my-2">
            {xp} <span className="text-lg font-bold text-slate-400">XP</span>
          </div>
          <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">bolt</span>
            {multiplier.toFixed(1)}x Multiplier
          </span>
        </div>

        {/* AI Camera Vision Status */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">AI VISION STATUS</span>
          <div className="text-2xl font-extrabold text-slate-800 tracking-tight my-2 flex items-center gap-2">
            <span className={`w-3.5 h-3.5 rounded-full ${isTracking ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
            {isTracking ? trackingStatus : "INACTIVE"}
          </div>
          <span className="text-xs font-bold text-slate-500">
            Threat Margin: <strong className="text-slate-900">{threatSeconds}s</strong>
          </span>
        </div>

        {/* Quick Action Start/Stop Card */}
        <div className="bg-gradient-to-br from-[#0047AB] to-[#0256D0] text-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <span className="text-xs font-extrabold tracking-wider text-blue-200 uppercase">FOCUS CONTROL</span>
          <div className="my-2">
            <h3 className="font-extrabold text-xl">
              {isTracking ? "Session Active" : "Ready to Focus?"}
            </h3>
            <p className="text-xs text-blue-100 mt-1 font-medium">
              {isTracking ? "AI camera monitoring eye gaze and posture." : "Click below to begin real-time focus AI tracking."}
            </p>
          </div>
          {isTracking ? (
            <button
              onClick={stopTracking}
              className="bg-white text-rose-600 hover:bg-rose-50 font-extrabold text-xs uppercase tracking-wider py-3 px-6 rounded-full shadow-sm transition-all"
            >
              Stop Tracking
            </button>
          ) : (
            <button
              onClick={startTracking}
              className="bg-white text-[#0047AB] hover:bg-blue-50 font-extrabold text-xs uppercase tracking-wider py-3 px-6 rounded-full shadow-sm transition-all"
            >
              Start Focus Session
            </button>
          )}
        </div>

      </div>

      {/* Main Grid: Live Camera Feed & Scanned Focus Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live AI Camera Feed */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0047AB]">videocam</span>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">LIVE CAMERA TELEMETRY</h3>
            </div>
            <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
              {isTracking ? "ONLINE" : "STANDBY"}
            </span>
          </div>

          {/* Camera Frame Display */}
          <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner">
            {camLoading ? (
              <div className="text-slate-300 text-xs font-bold flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Initializing Webcam...
              </div>
            ) : camErr ? (
              <div className="text-rose-400 text-xs font-bold p-4 text-center">
                {camErr}
              </div>
            ) : latestFrame ? (
              <img src={latestFrame} alt="Camera Telemetry Feed" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-500 text-xs font-semibold flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-slate-600">videocam_off</span>
                <span>Camera feed inactive. Start session to activate.</span>
              </div>
            )}

            {/* Overlay Status Badge */}
            {isTracking && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-900 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{trackingStatus}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 leading-relaxed font-medium">
            Prodo AI vision models process frame landmarks client-side to detect gaze direction and smartphone presence without saving video data.
          </div>
        </div>

        {/* Right Column: Scanned Focus Presets Cards (Inspired by KLIMA screenshot design) */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-widest">
              LIVE SCANNED REFUGE SESSIONS ({sessionPresets.length})
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Grid View</span>
              <button className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-base">grid_view</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sessionPresets.map((preset) => (
              <div
                key={preset.id}
                className={`bg-white border rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-6 ${
                  preset.active ? "border-[#0047AB] border-2 shadow-blue-500/10" : "border-slate-200/80"
                }`}
              >
                {/* Header Row with Circle Number Badge & Score Chip */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0047AB] text-white flex items-center justify-center font-extrabold text-sm shadow-xs flex-shrink-0">
                      {preset.id}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 tracking-tight leading-snug">
                        {preset.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">
                        {preset.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Score Pill Badge */}
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex flex-col items-center justify-center font-bold text-xs flex-shrink-0">
                    <span className="text-[9px] text-slate-400 font-medium leading-none">SCORE</span>
                    <span className="text-xs font-black text-slate-800 leading-none">{preset.score}</span>
                  </div>
                </div>

                {/* Main Stats Row */}
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-2xl font-extrabold text-[#0047AB] tracking-tight">
                      {preset.duration}
                    </div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      TARGET DURATION
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xs font-black uppercase tracking-wider ${preset.statusColor}`}>
                      {preset.status}
                    </div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      STATUS
                    </div>
                  </div>
                </div>

                {/* Metric Chips Row */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-slate-400">landscape</span>
                    {preset.elevation}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                    {preset.distance}
                  </span>
                </div>

                {/* Pill Action Button */}
                {preset.active ? (
                  <button
                    onClick={stopTracking}
                    className="w-full bg-[#0047AB] hover:bg-blue-700 text-white font-extrabold rounded-full py-3.5 px-6 shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">near_me</span>
                    <span>ACTIVE SESSION (STOP)</span>
                  </button>
                ) : (
                  <button
                    onClick={startTracking}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full py-3.5 px-6 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>START SESSION</span>
                  </button>
                )}

              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};

export default WhimsicalFocusPage;
