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
  // Use a ref for the stream so cleanup always gets the latest value (avoids stale closure)
  const streamRef = useRef<MediaStream | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [camLoading, setCamLoading] = useState(true);

  // Step 1: Get permission + start stream. After permission is granted,
  // enumerateDevices returns real labels and deviceIds.
  const startCameraStream = async (deviceId?: string) => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    setCamErr(null);
    setCamLoading(true);

    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: "user" }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Now that we have permission, enumerate to get real device names
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setAvailableDevices(videoDevices);

      // Auto-select the active track's device if none selected yet
      if (!deviceId && videoDevices.length > 0) {
        const activeTrackLabel = stream.getVideoTracks()[0]?.label;
        const matched = videoDevices.find(d => d.label === activeTrackLabel);
        if (matched) setCameraDevice(matched.deviceId);
      }

      setCamLoading(false);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCamLoading(false);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCamErr("❌ CAM_PERM_DENIED: Camera access was blocked. Enable it in macOS System Settings → Privacy & Security → Camera.");
      } else if (err.name === "NotFoundError") {
        setCamErr("❌ CAM_NOT_FOUND: No camera device detected. Ensure a webcam is connected.");
      } else if (err.name === "NotReadableError") {
        setCamErr("❌ CAM_IN_USE: Camera is already in use by another application (e.g. Zoom, Teams).");
      } else {
        setCamErr(`❌ CAM_ERR: ${err.message || "Unknown camera error."}`);
      }
    }
  };

  // On mount — start with the OS default camera
  useEffect(() => {
    startCameraStream(cameraDevice || undefined);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the user changes the device picker
  const handleDeviceChange = (deviceId: string) => {
    setCameraDevice(deviceId);
    startCameraStream(deviceId || undefined);
  };

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

          {camLoading && !camErr && (
            <div className="flex flex-col items-center gap-3 text-outline-variant z-10">
              <span className="w-5 h-5 border-2 border-outline-variant border-t-amber animate-spin rounded-full"></span>
              <span className="font-technical-prefix text-[10px] uppercase">Requesting camera access...</span>
            </div>
          )}

          {camErr ? (
            <div className="text-center px-6 max-w-md z-10">
              <span className="material-symbols-outlined text-[48px] text-crimson mb-3 block">no_photography</span>
              <div className="text-crimson font-log-body font-bold text-sm mb-3">{camErr}</div>
              <button
                onClick={() => startCameraStream(cameraDevice || undefined)}
                className="mt-2 px-4 py-2 border border-outline-variant text-primary font-technical-prefix text-[10px] uppercase hover:bg-surface-container-high transition-all"
              >
                Retry Camera Access
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover grayscale opacity-80 transition-opacity duration-300 ${camLoading ? "opacity-0" : "opacity-80"}`}
            />
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
            onChange={(e) => handleDeviceChange(e.target.value)}
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
