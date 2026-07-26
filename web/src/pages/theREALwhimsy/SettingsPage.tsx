import React from "react";
import { useFocus } from "../../context/FocusContext";

/**
 * WhimsicalSettingsPage - Preferences and device configuration.
 * Includes account card and webcam selection styled for the immersive dark mode.
 */
const WhimsicalSettingsPage: React.FC = () => {
  const { email, username, availableDevices, cameraDevice, setCameraDevice } = useFocus();

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

        {/* Visual Theme Status */}
        <div className="flex flex-col gap-4 pb-6 border-b border-lavender/30">
          <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wider">
            Appearance & Visual Theme
          </h3>
          <div className="p-4 rounded-2xl border-2 border-primary bg-primary/20 text-on-surface flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center text-lg">
              🌙
            </div>
            <div className="text-left">
              <div className="font-extrabold text-sm text-on-surface">Midnight Dark Theme</div>
              <div className="text-[10px] font-semibold opacity-60 uppercase tracking-wider">Active System Theme</div>
            </div>
          </div>
        </div>

        {/* Account Profile Card */}
        <div className="flex flex-col gap-4 pb-6 border-b border-lavender/30">
          <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wider">
            Account Profile
          </h3>
          <div className="flex items-center gap-4 bg-background/50 border border-lavender rounded-2xl p-4">
            <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary border border-secondary/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">person</span>
            </div>
            <div>
              <h4 className="font-extrabold text-base text-on-surface">
                {username || "User Account"}
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
