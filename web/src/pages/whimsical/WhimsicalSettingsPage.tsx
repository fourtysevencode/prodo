import React, { useState } from "react";
import { useFocus } from "../../context/FocusContext";

/**
 * WhimsicalSettingsPage - Preferences and device configuration for beta.prodo.live.
 * Features rounded toggle switches, account cards, and clear privacy controls.
 */
const WhimsicalSettingsPage: React.FC = () => {
  const { email, username, availableDevices, cameraDevice, setCameraDevice } = useFocus();
  const [allowTelemetry, setAllowTelemetry] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [raidNotify, setRaidNotify] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            SYSTEM PREFERENCES
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Settings & Hardware
          </h1>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-8 max-w-3xl">
        
        {/* Account Profile Card */}
        <div className="flex flex-col gap-4 pb-6 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Account Profile
          </h3>
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="w-12 h-12 rounded-full bg-[#0047AB] text-white flex items-center justify-center font-extrabold text-lg uppercase shadow-xs">
              {(username || "OP").substring(0, 2)}
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900">
                {username || "Operator"}
              </h4>
              <p className="text-xs font-semibold text-slate-400">
                {email || "user@prodo.live"}
              </p>
            </div>
          </div>
        </div>

        {/* Hardware Devices */}
        <div className="flex flex-col gap-4 pb-6 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Camera & Vision Sensor
          </h3>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700">Webcam Selection</label>
            <select
              value={cameraDevice}
              onChange={(e) => setCameraDevice(e.target.value)}
              className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0047AB]"
            >
              {availableDevices.length === 0 ? (
                <option value="">Default System Webcam</option>
              ) : (
                availableDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `Webcam Device ${idx + 1}`}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Telemetry & Privacy Controls */}
        <div className="flex flex-col gap-5 pb-6 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Telemetry & Privacy
          </h3>
          
          {/* Toggle 1: Telemetry */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Telemetry Logging</h4>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Dispatches anonymized focus metrics to improve AI vision models.
              </p>
            </div>
            <button
              onClick={() => setAllowTelemetry(!allowTelemetry)}
              className={`w-14 h-8 rounded-full p-1 transition-all ${
                allowTelemetry ? "bg-[#0047AB]" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  allowTelemetry ? "translate-x-6" : "translate-x-0"
                }`}
              ></div>
            </button>
          </div>

          {/* Toggle 2: Offline Mode */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Local Fallback Inference</h4>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Runs local client fallback detection if server connections are interrupted.
              </p>
            </div>
            <button
              onClick={() => setOfflineMode(!offlineMode)}
              className={`w-14 h-8 rounded-full p-1 transition-all ${
                offlineMode ? "bg-[#0047AB]" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  offlineMode ? "translate-x-6" : "translate-x-0"
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* Sound & Notifications */}
        <div className="flex flex-col gap-5">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Sound & Notifications
          </h3>

          {/* Toggle 3: Co-Op Notify */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Co-Op Break Notifications</h4>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Notify when a teammate in an active study room breaks focus.
              </p>
            </div>
            <button
              onClick={() => setRaidNotify(!raidNotify)}
              className={`w-14 h-8 rounded-full p-1 transition-all ${
                raidNotify ? "bg-[#0047AB]" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  raidNotify ? "translate-x-6" : "translate-x-0"
                }`}
              ></div>
            </button>
          </div>

          {/* Toggle 4: Sound FX */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Audio Alert Sounds</h4>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Play soft audio cues during focus warnings.
              </p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-14 h-8 rounded-full p-1 transition-all ${
                soundEnabled ? "bg-[#0047AB]" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  soundEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              ></div>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default WhimsicalSettingsPage;
