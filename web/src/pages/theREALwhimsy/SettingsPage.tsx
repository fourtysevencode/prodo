import React from "react";
import { useFocus } from "../../context/FocusContext";

/**
 * WhimsicalSettingsPage - Preferences and device configuration.
 * Includes account card and webcam selection styled for the immersive dark mode.
 */
const WhimsicalSettingsPage: React.FC = () => {
  const { email, username, availableDevices, cameraDevice, setCameraDevice, theme, setTheme } = useFocus();

  return (
    <div className="flex flex-col gap-6 pb-12 mt-8">

      {/* Header */}
      <div className="bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-on-surface/50 uppercase tracking-widest">
            SYSTEM PREFERENCES
          </span>
          <h1 className="text-3xl font-display font-black text-on-surface tracking-tight mt-1">
            Settings & Hardware
          </h1>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 md:p-8 kawaii-shadow flex flex-col gap-8 max-w-3xl">

        {/* Dark / Light Mode Selector */}
        <div className="flex flex-col gap-4 pb-6 border-b border-lavender/30">
          <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wider">
            Appearance & Visual Theme
          </h3>
          <p className="text-[10px] font-medium text-on-surface/50">
            Choose your preferred color theme mode for the Prodo interface.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-2">
            {/* Light Mode Button */}
            <button
              onClick={() => setTheme("light")}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${theme === "light"
                ? "border-primary bg-primary/20 text-on-surface shadow-md shadow-primary/20"
                : "border-lavender bg-background/50 text-on-surface/50 hover:bg-surface hover:border-primary/50"
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${theme === "light" ? "bg-primary text-white" : "bg-surface text-on-surface/50"
                }`}>
                ☀️
              </div>
              <div className="text-left">
                <div className="font-extrabold text-sm text-on-surface">Light Mode</div>
                <div className="text-[10px] font-semibold opacity-50 uppercase tracking-wider">Bright & Clean</div>
              </div>
            </button>

            {/* Dark Mode Button */}
            <button
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${theme === "dark"
                ? "border-primary bg-primary/20 text-on-surface shadow-md shadow-primary/20"
                : "border-lavender bg-background/50 text-on-surface/50 hover:bg-surface hover:border-primary/50"
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${theme === "dark" ? "bg-primary text-white" : "bg-surface text-on-surface/50"
                }`}>
                🌙
              </div>
              <div className="text-left">
                <div className="font-extrabold text-sm text-on-surface">Dark Mode</div>
                <div className="text-[10px] font-semibold opacity-50 uppercase tracking-wider">Midnight Glow</div>
              </div>
            </button>
          </div>
        </div>

        {/* Account Profile Card */}
        <div className="flex flex-col gap-4 pb-6 border-b border-lavender/30">
          <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wider">
            Account Profile
          </h3>
          <div className="flex items-center gap-4 bg-background/50 border border-lavender rounded-2xl p-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 text-primary border border-primary flex items-center justify-center font-black text-lg uppercase shadow-sm">
              {(username || "OP").substring(0, 2)}
            </div>
            <div>
              <h4 className="font-extrabold text-base text-on-surface">
                {username || "User"}
              </h4>
              <p className="text-[10px] font-bold text-on-surface/50 tracking-wider">
                {email || "user@prodo.live"}
              </p>
            </div>
          </div>
        </div>

        {/* Camera Selection */}
        <div className="flex flex-col gap-4 pb-6 border-b border-lavender/30">
          <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wider">
            Camera & Vision Sensor
          </h3>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-on-surface/70 uppercase tracking-wider">Webcam Selection</label>
            <select
              value={cameraDevice}
              onChange={(e) => setCameraDevice(e.target.value)}
              className="bg-background border border-lavender rounded-xl px-4 py-3 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary focus:bg-surface"
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
