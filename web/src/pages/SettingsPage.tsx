import React, { useState } from "react";
import { useFocus } from "../context/FocusContext";

const SettingsPage: React.FC = () => {
  const { email, username } = useFocus();
  const [allowTelemetry, setAllowTelemetry] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [raidNotify, setRaidNotify] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="flex-grow flex flex-col p-6 h-full overflow-y-auto select-none">
      {/* Page Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="font-value-lg text-[32px] text-primary">PREFERENCES</h1>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant p-6 flex flex-col gap-6 max-w-2xl">
        {/* Section 1: Account Info */}
        <div className="border-b border-surface-variant pb-6">
          <h3 className="font-log-body font-bold text-sm text-primary uppercase mb-4">Account Profile</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-surface-variant flex items-center justify-center border border-outline-variant flex-shrink-0">
              <span className="material-symbols-outlined text-outline text-[24px]">account_circle</span>
            </div>
            <div className="flex-grow">
              <div className="font-log-body text-primary font-bold text-base">{username || "OPERATOR"}</div>
              <div className="font-technical-prefix text-[11px] text-outline-variant">{email || "user@prodo.live"}</div>
            </div>
          </div>
        </div>

        {/* Section 2: Privacy Guards */}
        <div className="border-b border-surface-variant pb-6">
          <h3 className="font-log-body font-bold text-sm text-primary uppercase mb-4">Telemetry & Privacy</h3>
          <div className="flex flex-col gap-4">
            
            {/* Toggle 1: Telemetry */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 pr-6">
                <div className="font-log-body font-bold text-sm text-on-surface">Telemetry Logging</div>
                <div className="font-technical-prefix text-[10px] text-outline-variant">
                  Dispatches focus telemetry reports to telemetry@prodo.live and support@prodo.live.
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
                <div className="font-log-body font-bold text-sm text-on-surface">Local Fallback Inference</div>
                <div className="font-technical-prefix text-[10px] text-outline-variant">
                  Runs local computer vision fallback using OpenCV Haar cascades if cloud server is unavailable.
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
          <h3 className="font-log-body font-bold text-sm text-primary uppercase mb-4">Sound & Notifications</h3>
          <div className="flex flex-col gap-4">

            {/* Toggle 3: Raid Notify */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1 pr-6">
                <div className="font-log-body font-bold text-sm text-on-surface">Co-Op Break Notifications</div>
                <div className="font-technical-prefix text-[10px] text-outline-variant">
                  Notify when a teammate in an active Co-Op room breaks focus.
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
                <div className="font-log-body font-bold text-sm text-on-surface">Audio Alert Sounds</div>
                <div className="font-technical-prefix text-[10px] text-outline-variant">
                  Play audio alerts during distraction warnings.
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
