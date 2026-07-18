import React, { useState } from "react";

const SettingsPage: React.FC = () => {
  const [allowTelemetry, setAllowTelemetry] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [raidNotify, setRaidNotify] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="flex-grow flex flex-col p-6 h-full overflow-y-auto select-none">
      {/* Page Header */}
      <div className="mb-6 flex-shrink-0">
        <div className="font-technical-prefix text-technical-prefix text-outline-variant">PRODO_SYSTEM_SETTINGS</div>
        <h1 className="font-value-lg text-[32px] text-primary">GLOBAL PREFERENCES</h1>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant p-6 flex flex-col gap-6 max-w-2xl">
        {/* Section 1: Account Info */}
        <div className="border-b border-surface-variant pb-6">
          <h3 className="font-log-body font-bold text-sm text-primary uppercase mb-4">Operator Node Credentials</h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-16 h-16 bg-surface-variant flex items-center justify-center border border-outline-variant flex-shrink-0">
                <span className="material-symbols-outlined text-outline text-[32px]">admin_panel_settings</span>
              </div>
              <div className="flex-grow w-full">
                <div className="font-technical-prefix text-[8px] text-outline-variant">LOGGED_IN_AS</div>
                <div className="font-log-body text-primary font-bold">ACTIVE OPERATOR</div>
                <div className="font-technical-prefix text-[10px] text-emerald mt-1">✓ AUTHENTICATION: GOOGLE_LINKED</div>
              </div>
            </div>

            {/* Desktop Token Sync Card */}
            <div className="border border-outline-variant p-4 bg-background flex flex-col gap-2 mt-2">
              <div className="font-technical-prefix text-[8px] text-outline-variant uppercase">Desktop Auth Key (Copy to paste in Tauri)</div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={localStorage.getItem("prodo_token") || ""} 
                  placeholder="No active session token found."
                  className="flex-grow bg-surface-container-high border border-outline-variant px-3 py-1.5 font-technical-prefix text-xs text-amber outline-none select-all" 
                />
                <button 
                  type="button"
                  onClick={() => {
                    const t = localStorage.getItem("prodo_token");
                    if (t) {
                      navigator.clipboard.writeText(t);
                      alert("✓ Token copied to clipboard!");
                    } else {
                      alert("❌ No token found. Please log in.");
                    }
                  }}
                  className="px-4 py-1.5 bg-amber text-background font-technical-prefix text-[10px] font-bold uppercase hover:bg-amber-400"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Privacy Guards */}
        <div className="border-b border-surface-variant pb-6">
          <h3 className="font-log-body font-bold text-sm text-primary uppercase mb-4">Privacy & Security Shields</h3>
          <div className="flex flex-col gap-4">
            
            {/* Toggle 1: Telemetry */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 pr-6">
                <div className="font-log-body font-bold text-sm text-on-surface">Telemetry Logs Upload</div>
                <div className="font-technical-prefix text-[8px] text-outline-variant">
                  Allows sending periodic distraction logs to leaderboards. Disabling hides your logs.
                </div>
              </div>
              <button 
                onClick={() => setAllowTelemetry(!allowTelemetry)}
                className={`w-14 h-6 border flex items-center px-1 transition-all ${
                  allowTelemetry ? "border-emerald bg-emerald/10 justify-end" : "border-outline-variant bg-[#0A0A0A] justify-start"
                }`}
              >
                <span className={`font-technical-prefix text-[8px] uppercase font-bold mr-2 ${allowTelemetry ? "text-emerald block" : "hidden"}`}>ON</span>
                <div className={`w-4 h-4 ${allowTelemetry ? "bg-emerald" : "bg-outline-variant"}`}></div>
                <span className={`font-technical-prefix text-[8px] uppercase font-bold ml-2 ${!allowTelemetry ? "text-outline-variant block" : "hidden"}`}>OFF</span>
              </button>
            </div>

            {/* Toggle 2: Local Offline Mode */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 pr-6">
                <div className="font-log-body font-bold text-sm text-on-surface">Local Fallback mode</div>
                <div className="font-technical-prefix text-[8px] text-outline-variant">
                  Run computer vision locally using Haar cascades if the connection to HuggingFace is broken.
                </div>
              </div>
              <button 
                onClick={() => setOfflineMode(!offlineMode)}
                className={`w-14 h-6 border flex items-center px-1 transition-all ${
                  offlineMode ? "border-emerald bg-emerald/10 justify-end" : "border-outline-variant bg-[#0A0A0A] justify-start"
                }`}
              >
                <span className={`font-technical-prefix text-[8px] uppercase font-bold mr-2 ${offlineMode ? "text-emerald block" : "hidden"}`}>ON</span>
                <div className={`w-4 h-4 ${offlineMode ? "bg-emerald" : "bg-outline-variant"}`}></div>
                <span className={`font-technical-prefix text-[8px] uppercase font-bold ml-2 ${!offlineMode ? "text-outline-variant block" : "hidden"}`}>OFF</span>
              </button>
            </div>

          </div>
        </div>

        {/* Section 3: Notification HUD */}
        <div>
          <h3 className="font-log-body font-bold text-sm text-primary uppercase mb-4">HUD Sound & Notifications</h3>
          <div className="flex flex-col gap-4">

            {/* Toggle 3: Raid Notify */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 pr-6">
                <div className="font-log-body font-bold text-sm text-on-surface">Raid Focus Break Alerts</div>
                <div className="font-technical-prefix text-[8px] text-outline-variant">
                  Triggers OS notifications when a teammate in a synchronized focus raid breaks focus.
                </div>
              </div>
              <button 
                onClick={() => setRaidNotify(!raidNotify)}
                className={`w-14 h-6 border flex items-center px-1 transition-all ${
                  raidNotify ? "border-emerald bg-emerald/10 justify-end" : "border-outline-variant bg-[#0A0A0A] justify-start"
                }`}
              >
                <span className={`font-technical-prefix text-[8px] uppercase font-bold mr-2 ${raidNotify ? "text-emerald block" : "hidden"}`}>ON</span>
                <div className={`w-4 h-4 ${raidNotify ? "bg-emerald" : "bg-outline-variant"}`}></div>
                <span className={`font-technical-prefix text-[8px] uppercase font-bold ml-2 ${!raidNotify ? "text-outline-variant block" : "hidden"}`}>OFF</span>
              </button>
            </div>

            {/* Toggle 4: Sound FX */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 pr-6">
                <div className="font-log-body font-bold text-sm text-on-surface">Tactical Threat Warnings (Audio)</div>
                <div className="font-technical-prefix text-[8px] text-outline-variant">
                  Play warning alarms during threat meter decays and points deductions.
                </div>
              </div>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-14 h-6 border flex items-center px-1 transition-all ${
                  soundEnabled ? "border-emerald bg-emerald/10 justify-end" : "border-outline-variant bg-[#0A0A0A] justify-start"
                }`}
              >
                <span className={`font-technical-prefix text-[8px] uppercase font-bold mr-2 ${soundEnabled ? "text-emerald block" : "hidden"}`}>ON</span>
                <div className={`w-4 h-4 ${soundEnabled ? "bg-emerald" : "bg-outline-variant"}`}></div>
                <span className={`font-technical-prefix text-[8px] uppercase font-bold ml-2 ${!soundEnabled ? "text-outline-variant block" : "hidden"}`}>OFF</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
