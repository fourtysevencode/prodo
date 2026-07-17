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
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [camErr, setCamErr] = useState<string | null>(null);

  // Enumerate cameras
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        setAvailableDevices(videoDevices);
      })
      .catch(err => {
        console.error("Error listing cameras:", err);
      });
  }, []);

  // Request camera stream based on selected device
  useEffect(() => {
    // Stop any existing stream tracks first
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    setCamErr(null);

    const constraints: MediaStreamConstraints = {
      video: cameraDevice 
        ? { deviceId: { exact: cameraDevice } } 
        : true
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(s => {
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(err => {
        console.error("Camera access error:", err);
        setCamErr("❌ CAM_INITIALIZE_FAIL: Permissions blocked or device in use by another process.");
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraDevice]);

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

          {camErr ? (
            <div className="text-center px-6 max-w-md z-10">
              <div className="text-crimson font-log-body font-bold text-sm mb-3">{camErr}</div>
              <div className="text-[11px] text-outline-variant">
                Enable camera access in macOS Privacy & Security preferences or ensure no other app is capturing your webcam feed.
              </div>
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

          {/* Grid overlay to give tactical/terminal mesh effect */}
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
            {availableDevices.length === 0 ? (
              <option value="">Default OS Webcam Node</option>
            ) : (
              availableDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera Node (${d.deviceId.substring(0,8)})`}</option>
              ))
            )}
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
