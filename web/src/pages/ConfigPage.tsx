import React from "react";
import { useFocus } from "../context/FocusContext";

const ConfigPage: React.FC = () => {
  const {
    gazeTolerance,
    graceDuration,
    basePenalty,
    cameraDevice,
    setGazeTolerance,
    setGraceDuration,
    setBasePenalty,
    setCameraDevice
  } = useFocus();

  return (
    <div className="flex-grow flex flex-col lg:flex-row gap-6 p-6 h-full overflow-hidden select-none">
      {/* Left panel - Privacy Guard Warning */}
      <section className="flex-1 flex flex-col h-full gap-6">
        <div>
          <div className="font-technical-prefix text-technical-prefix text-outline-variant">PRODO_ENGINE_CALIBRATION</div>
          <h1 className="font-value-lg text-[32px] text-primary">CV CALIBRATION</h1>
        </div>

        {/* Warn banner instead of video preview */}
        <div className="flex-grow bg-surface-container-lowest border border-outline-variant relative flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
          <div className="absolute top-4 left-4 font-technical-prefix text-technical-prefix text-outline-variant uppercase">
            [WEB_PRIVACY_SHIELD]
          </div>

          <div className="max-w-md flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-[64px] text-amber drop-shadow-[0_0_8px_rgba(255,191,0,0.4)]">
              enhanced_encryption
            </span>
            <div className="text-amber font-log-body font-bold text-sm uppercase">
              ⚠️ Webcam Calibration Shielded On Web Endpoints
            </div>
            <p className="text-xs text-outline-variant leading-relaxed">
              To prevent security leaks, raw camera capture feeds are restricted to the local **Prodo Desktop client** and companion mobile applications. No camera tracking frames are rendered or transmitted from the browser.
            </p>
            <div className="mt-2 p-3 bg-surface-container-high border border-outline-variant text-[10px] font-technical-prefix text-outline text-left">
              &gt; To calibrate: Run Prodo local GUI.<br/>
              &gt; Telemetry sync: Active over Secure API.
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel - Configuration Adjustments */}
      <section className="w-full lg:w-[360px] flex flex-col gap-6 h-full flex-shrink-0 overflow-y-auto pr-1">
        {/* Device selector */}
        <div className="border border-outline-variant bg-surface-container-lowest p-5 flex flex-col gap-4">
          <div>
            <div className="font-technical-prefix text-technical-prefix text-outline-variant uppercase mb-1">SELECT_HARDWARE_NODE</div>
            <h3 className="font-log-body font-bold text-sm text-primary uppercase">CAMERA CAPTURE DEV</h3>
          </div>
          <select 
            value={cameraDevice} 
            onChange={(e) => setCameraDevice(e.target.value)}
            className="w-full bg-background border border-outline-variant text-on-surface px-3 py-2 font-technical-prefix text-xs outline-none focus:border-primary select-custom"
          >
            <option value="default">Default OS Webcam Node</option>
            <option value="virtual">OBS Virtual Camera Node</option>
            <option value="phone">Companion Mobile Camera Node</option>
          </select>
        </div>

        {/* Engine sliders */}
        <div className="border border-outline-variant bg-surface-container-lowest p-5 flex flex-col gap-6 flex-grow">
          <div>
            <div className="font-technical-prefix text-technical-prefix text-outline-variant uppercase mb-1">SYS_ENG_VARIABLES</div>
            <h3 className="font-log-body font-bold text-sm text-primary uppercase">GAZE CALIBRATION</h3>
          </div>

          {/* Slider 1: Gaze Tolerance */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-technical-prefix text-xs">
              <span className="text-outline-variant">GAZE TOLERANCE ANGLES</span>
              <span className="text-amber font-bold">{gazeTolerance}°</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="45" 
              value={gazeTolerance} 
              onChange={(e) => setGazeTolerance(parseInt(e.target.value))}
              className="w-full accent-amber bg-surface-container-highest cursor-pointer h-1.5"
            />
            <span className="font-technical-prefix text-[8px] text-outline-variant">
              Tuning this lower requires stricter alignment directly facing the screen.
            </span>
          </div>

          {/* Slider 2: Grace Duration */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-technical-prefix text-xs">
              <span className="text-outline-variant">GRACE PERIOD DURATION</span>
              <span className="text-amber font-bold">{graceDuration}s</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="60" 
              value={graceDuration} 
              onChange={(e) => setGraceDuration(parseInt(e.target.value))}
              className="w-full accent-amber bg-surface-container-highest cursor-pointer h-1.5"
            />
            <span className="font-technical-prefix text-[8px] text-outline-variant">
              Time allowed away from the screen before penalties apply (default 15s).
            </span>
          </div>

          {/* Slider 3: Base Penalty Cost */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-technical-prefix text-xs">
              <span className="text-outline-variant">BASE PENALTY COST</span>
              <span className="text-amber font-bold">{basePenalty} XP</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="200" 
              value={basePenalty} 
              onChange={(e) => setBasePenalty(parseInt(e.target.value))}
              className="w-full accent-amber bg-surface-container-highest cursor-pointer h-1.5"
            />
            <span className="font-technical-prefix text-[8px] text-outline-variant">
              Bystander penalty fee deducted when focus grace periods fail completely.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConfigPage;
