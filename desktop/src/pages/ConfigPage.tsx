import React, { useEffect } from "react";
import { useFocus } from "../context/FocusContext";

const ConfigPage: React.FC = () => {
  const {
    gazeTolerance,
    graceDuration,
    basePenalty,
    cameraDevice,
    latestFrame,
    availableDevices,
    camErr,
    camLoading,
    setIsCalibrating,
    setGazeTolerance,
    setGraceDuration,
    setBasePenalty,
    setCameraDevice
  } = useFocus();

  // Turn on calibrating flag when visiting page to start camera & check-focus loops, turn off on unmount
  useEffect(() => {
    setIsCalibrating(true);
    return () => {
      setIsCalibrating(false);
    };
  }, [setIsCalibrating]);

  return (
    <div className="flex-grow flex flex-col lg:flex-row gap-6 p-6 h-full overflow-hidden select-none">
      {/* Left panel - Calibration preview */}
      <section className="flex-1 flex flex-col h-full gap-6">
        <div>
          <div className="font-technical-prefix text-technical-prefix text-outline-variant">PRODO_ENGINE_CALIBRATION</div>
          <h1 className="font-value-lg text-[32px] text-primary">CV CALIBRATION</h1>
        </div>

        {/* Video feed container */}
        <div className="flex-grow bg-surface-container-lowest border border-outline-variant relative flex items-center justify-center overflow-hidden min-h-[300px]">
          <div className="absolute top-4 left-4 font-technical-prefix text-technical-prefix text-outline-variant uppercase z-10">
            [SYS_FEED_PREVIEW]
          </div>

          {camLoading && !latestFrame && (
            <div className="flex flex-col items-center gap-3 text-outline-variant z-10">
              <span className="w-5 h-5 border-2 border-outline-variant border-t-amber animate-spin rounded-full"></span>
              <span className="font-technical-prefix text-[10px] uppercase">Connecting hardware node...</span>
            </div>
          )}

          {camErr ? (
            <div className="text-center px-6 max-w-md z-10">
              <span className="material-symbols-outlined text-[48px] text-crimson mb-3 block">no_photography</span>
              <div className="text-crimson font-log-body font-bold text-sm mb-3">{camErr}</div>
            </div>
          ) : (
            latestFrame ? (
              <img
                src={latestFrame}
                alt="System Frame Preview"
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-80"
              />
            ) : (
              !camLoading && (
                <div className="text-center text-outline-variant font-technical-prefix text-xs z-10">
                  CAMERA STREAM INITIALIZING...
                </div>
              )
            )
          )}

          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none border border-dashed border-outline-variant/10 flex flex-wrap z-20">
            <div className="w-1/2 h-1/2 border-r border-b border-dashed border-outline-variant/10"></div>
            <div className="w-1/2 h-1/2 border-b border-dashed border-outline-variant/10"></div>
            <div className="w-1/2 h-1/2 border-r border-dashed border-outline-variant/10"></div>
            <div className="w-1/2 h-1/2 border-dashed border-outline-variant/10"></div>
          </div>

          {/* Central alignment box */}
          <div className="absolute w-40 h-40 border-2 border-dashed border-amber/30 z-30 pointer-events-none flex items-center justify-center">
            <div className="w-4 h-4 border-l-2 border-t-2 border-amber"></div>
            <div className="w-4 h-4 border-r-2 border-t-2 border-amber ml-auto"></div>
            <div className="w-4 h-4 border-l-2 border-b-2 border-amber mt-auto mr-auto"></div>
            <div className="w-4 h-4 border-r-2 border-b-2 border-amber mt-auto"></div>
          </div>
        </div>
      </section>

      {/* Right Panel - Configuration */}
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
            className="w-full bg-background border border-outline-variant text-on-surface px-3 py-2 font-technical-prefix text-xs outline-none focus:border-primary"
          >
            {availableDevices.length === 0 ? (
              <option value="">Default OS Webcam (detecting...)</option>
            ) : (
              availableDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera (${d.deviceId.substring(0, 8)}...)`}
                </option>
              ))
            )}
          </select>
          {availableDevices.length > 0 && (
            <div className="font-technical-prefix text-[8px] text-emerald">
              ✓ {availableDevices.length} camera node{availableDevices.length > 1 ? "s" : ""} detected
            </div>
          )}
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
              type="range" min="5" max="45" value={gazeTolerance}
              onChange={(e) => setGazeTolerance(parseInt(e.target.value))}
              className="w-full accent-amber bg-surface-container-highest cursor-pointer h-1.5"
            />
            <span className="font-technical-prefix text-[8px] text-outline-variant">
              Stricter values require more direct face-to-screen alignment.
            </span>
          </div>

          {/* Slider 2: Grace Duration */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-technical-prefix text-xs">
              <span className="text-outline-variant">GRACE PERIOD DURATION</span>
              <span className="text-amber font-bold">{graceDuration}s</span>
            </div>
            <input
              type="range" min="1" max="60" value={graceDuration}
              onChange={(e) => setGraceDuration(parseInt(e.target.value))}
              className="w-full accent-amber bg-surface-container-highest cursor-pointer h-1.5"
            />
            <span className="font-technical-prefix text-[8px] text-outline-variant">
              Time allowed looking away before penalties apply (default 15s).
            </span>
          </div>

          {/* Slider 3: Base Penalty */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-technical-prefix text-xs">
              <span className="text-outline-variant">BASE PENALTY COST</span>
              <span className="text-amber font-bold">{basePenalty} XP</span>
            </div>
            <input
              type="range" min="10" max="200" value={basePenalty}
              onChange={(e) => setBasePenalty(parseInt(e.target.value))}
              className="w-full accent-amber bg-surface-container-highest cursor-pointer h-1.5"
            />
            <span className="font-technical-prefix text-[8px] text-outline-variant">
              XP deducted when the grace period expires completely.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConfigPage;
