import React, { useState } from "react";
import { useFocus } from "../../context/FocusContext";

/**
 * WhimsicalSettingsPage - Preferences and device configuration.
 * Includes Light & Dark mode theme buttons, account card, and privacy controls.
 */
const WhimsicalSettingsPage: React.FC = () => {
  const { email, username, availableDevices, cameraDevice, setCameraDevice, theme, toggleTheme, setTheme } = useFocus();
  const [allowTelemetry, setAllowTelemetry] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [raidNotify, setRaidNotify] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="flex flex-col gap-6 pb-12">

      {/* Header */}
      <div className="bg-white dark:bg-[#1A1C3D] border border-slate-200/80 dark:border-[#2D3261] rounded-3xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            SYSTEM PREFERENCES
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Settings & Hardware
          </h1>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white dark:bg-[#1A1C3D] border border-slate-200/80 dark:border-[#2D3261] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-8 max-w-3xl">

        {/* Dark / Light Mode Selector */}
        <div className="flex flex-col gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            Appearance & Visual Theme
          </h3>
          <p className="text-xs font-medium text-slate-400">
            Choose your preferred color theme mode for the Prodo interface.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-2">
            {/* Light Mode Button */}
            <button
              onClick={() => setTheme("light")}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${theme === "light"
                ? "border-[#9D72FF] bg-[#9D72FF]/10 text-slate-900 shadow-sm"
                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:border-slate-300"
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${theme === "light" ? "bg-[#9D72FF] text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}>
                ☀️
              </div>
              <div className="text-left">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white">Light Mode</div>
                <div className="text-[11px] font-semibold text-slate-400">Bright & Clean</div>
              </div>
            </button>

            {/* Dark Mode Button */}
            <button
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${theme === "dark"
                ? "border-[#9D72FF] bg-[#9D72FF]/10 text-white shadow-sm"
                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:border-slate-300"
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${theme === "dark" ? "bg-[#9D72FF] text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}>
                🌙
              </div>
              <div className="text-left">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white">Dark Mode</div>
                <div className="text-[11px] font-semibold text-slate-400">Midnight Glow</div>
              </div>
            </button>
          </div>
        </div>

        {/* Account Profile Card */}
        <div className="flex flex-col gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            Account Profile
          </h3>
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4">
            <div className="w-12 h-12 rounded-full bg-[#9D72FF] text-white flex items-center justify-center font-extrabold text-lg uppercase shadow-xs">
              {(username || "OP").substring(0, 2)}
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                {username || "User"}
              </h4>
              <p className="text-xs font-semibold text-slate-400">
                {email || "user@prodo.live"}
              </p>
            </div>
          </div>
        </div>

        {/* Camera Selection */}
        <div className="flex flex-col gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            Camera & Vision Sensor
          </h3>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Webcam Selection</label>
            <select
              value={cameraDevice}
              onChange={(e) => setCameraDevice(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#9D72FF]"
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

      </div>

    </div>
  );
};

export default WhimsicalSettingsPage;
