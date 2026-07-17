import React, { useEffect, useRef, useState } from "react";
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        setStream(s);
        setErr(null);
        setLoading(false);
      })
      .catch(e => {
        setErr("❌ HARDWARE_ERR: Camera device blocked or occupied.");
        setLoading(false);
        console.error(e);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="flex-grow flex flex-col lg:flex-row gap-6 p-6 h-full overflow-hidden select-none">
      {/* Left panel - Calibration preview */}
      <section className="flex-1 flex flex-col h-full gap-6">
        <div>
          <div className="font-technical-prefix text-technical-prefix text-outline-variant">PRODO_ENGINE_CALIBRATION</div>
          <h1 className="font-value-lg text-[32px] text-primary">CV CALIBRATION</h1>
        </div>

        {/* Video preview container */}
        <div className="flex-grow bg-surface-container-lowest border border-outline-variant relative flex items-center justify-center overflow-hidden min-h-[300px]">
          <div className="absolute top-4 left-4 font-technical-prefix text-technical-prefix text-outline-variant uppercase z-10">
            [SYS_FEED_PREVIEW]
          </div>

          {loading && (
            <div className="flex flex-col items-center gap-3 text-outline-variant z-10">
              <span className="w-5 h-5 border-2 border-outline-variant border-t-amber animate-spin rounded-full"></span>
              <span className="font-technical-prefix text-[10px] uppercase">Connecting hardware node...</span>
            </div>
          )}

          {err ? (
            <div className="text-center px-6 max-w-md z-10">
              <span className="material-symbols-outlined text-[48px] text-crimson mb-3 block">no_photography</span>
              <div className="text-crimson font-log-body font-bold text-sm mb-3">{err}</div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-80"
            />
          )}

          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none border border-dashed border-outline-variant/10 flex flex-wrap z-20">
            <div className="w-1/2 h-1/2 border-r border-b border-dashed border-outline-variant/10"></div>
            <div className="w-1/2 h-1/2 border-b border-dashed border-outline-variant/10"></div>
            <div className="w-1/2 h-1/2 border-r border-dashed border-outline-variant/10"></div>
            <div className="w-1/2 h-1/2 border-dashed border-outline-variant/10"></div>
          </div>

          {/* HUD scanlines */}
          <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.03] z-20"></div>

          {/* Focus lock reticle */}
          <div className="absolute w-24 h-24 border border-primary/20 rounded-full flex items-center justify-center pointer-events-none z-20">
            <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
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
          </select>
        </div>

        {/* Variables slider */}
        <div className="border border-outline-variant bg-surface-container-lowest p-5 flex flex-col gap-6 flex-grow">
          <div>
            <div className="font-technical-prefix text-technical-prefix text-outline-variant uppercase mb-1">SYS_ENG_VARIABLES</div>
            <h3 className="font-log-body font-bold text-sm text-primary uppercase">GAZE CALIBRATION</h3>
          </div>

          {/* Gaze tolerance */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-technical-prefix">
              <span className="text-outline-variant uppercase">Gaze Tolerance Angles</span>
              <span className="text-primary font-bold">{gazeTolerance}°</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="35" 
              value={gazeTolerance} 
              onChange={(e) => setGazeTolerance(Number(e.target.value))}
              className="w-full accent-primary bg-surface-container-high h-1 appearance-none cursor-pointer"
            />
            <span className="text-[9px] text-outline-variant leading-relaxed">
              Tuning this lower requires stricter alignment directly facing the screen.
            </span>
          </div>

          {/* Grace period */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-technical-prefix">
              <span className="text-outline-variant uppercase">Grace Period Duration</span>
              <span className="text-primary font-bold">{graceDuration}s</span>
            </div>
            <input 
              type="range" 
              min="3" 
              max="60" 
              value={graceDuration} 
              onChange={(e) => setGraceDuration(Number(e.target.value))}
              className="w-full accent-primary bg-surface-container-high h-1 appearance-none cursor-pointer"
            />
            <span className="text-[9px] text-outline-variant leading-relaxed">
              Allowed look-away duration before focus breach is registered.
            </span>
          </div>

          {/* Base penalty */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-technical-prefix">
              <span className="text-outline-variant uppercase">Base Penalty Amount</span>
              <span className="text-primary font-bold">-{basePenalty} XP</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="500" 
              step="50"
              value={basePenalty} 
              onChange={(e) => setBasePenalty(Number(e.target.value))}
              className="w-full accent-primary bg-surface-container-high h-1 appearance-none cursor-pointer"
            />
            <span className="text-[9px] text-outline-variant leading-relaxed">
              Points subtracted instantly on focus breach grace expiration.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConfigPage;
