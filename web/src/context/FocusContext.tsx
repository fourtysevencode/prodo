import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { apiSync, apiGetMe, apiCheckFocus } from "../api/prodoApi";

export interface Infraction {
  timestamp: string;
  code: string;
  name: string;
  details: string;
}

export interface AppVaultItem {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  timerRemaining?: number; // in seconds
  icon: string;
}

export interface SystemLog {
  timestamp: string;
  type: "SYSTEM" | "ERROR" | "SUCCESS" | "INFO";
  code: string;
  message: string;
}

interface FocusContextType {
  xp: number;
  coreTemp: number;
  multiplier: number;
  netLink: number;
  threatSeconds: number; // 0 to 15
  isTracking: boolean;
  trackingStatus: "FOCUSED" | "DISTRACTED" | "UNCERTAIN";
  infractions: Infraction[];
  vaultItems: AppVaultItem[];
  systemLogs: SystemLog[];
  gazeTolerance: number;
  graceDuration: number;
  basePenalty: number;
  cameraDevice: string;
  sessionTime: number; // in seconds
  username: string;
  email: string;
  isCoopActive: boolean;
  setIsCoopActive: (val: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  startTracking: () => void;
  stopTracking: () => void;
  purchaseApp: (id: string) => void;
  purchaseBreakTime: (seconds: number) => boolean;
  breakTimeRemaining: number;
  setGazeTolerance: (val: number) => void;
  setGraceDuration: (val: number) => void;
  setBasePenalty: (val: number) => void;
  setCameraDevice: (val: string) => void;
  executeCommand: (cmd: string) => string;
  // CV Extensions
  latestFrame: string | null;
  isCalibrating: boolean;
  availableDevices: MediaDeviceInfo[];
  camErr: string | null;
  camLoading: boolean;
  setIsCalibrating: (val: boolean) => void;
  // Phone detection
  phoneWarning: boolean;
  dismissPhoneWarning: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) throw new Error("useFocus must be used within FocusProvider");
  return context;
};

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xp, setXp] = useState(0);
  const [coreTemp, setCoreTemp] = useState(36);
  const [multiplier, setMultiplier] = useState(1.0);
  const [netLink, setNetLink] = useState(0);
  const [threatSeconds, setThreatSeconds] = useState(15);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<"FOCUSED" | "DISTRACTED" | "UNCERTAIN">("UNCERTAIN");
  
  // Configuration Variables
  const [gazeTolerance, setGazeTolerance] = useState(15);
  const [graceDuration, setGraceDuration] = useState(15);
  const [basePenalty, setBasePenalty] = useState(50);
  const [cameraDevice, setCameraDevice] = useState("");
  const [isCoopActive, setIsCoopActive] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("prodo_token"));
  const [sessionTime, setSessionTime] = useState(0);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");


  useEffect(() => {
    if (isAuthenticated) {
      apiGetMe()
        .then(profile => {
          setUsername(profile.username);
          setEmail(profile.email);
          setXp(profile.current_balance);
        })
        .catch(err => {
          console.error("Failed to load operator profile:", err);
        });
    } else {
      setUsername("");
      setEmail("");
    }
  }, [isAuthenticated]);
  
  // Break Time variables
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);

  // CV States
  const [latestFrame, setLatestFrame] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [camLoading, setCamLoading] = useState(false);

  // Refs that mirror CV state for use inside stale closures (setInterval callbacks)
  const latestFrameRef = useRef<string | null>(null);
  const camErrRef = useRef<string | null>(null);
  useEffect(() => { latestFrameRef.current = latestFrame; }, [latestFrame]);
  useEffect(() => { camErrRef.current = camErr; }, [camErr]);

  // Phone detection state
  const [phoneWarning, setPhoneWarning] = useState(false);
  const phoneDetectedCountRef = useRef(0);

  const [infractions, setInfractions] = useState<Infraction[]>([
    { timestamp: "14:02:45", code: "ERR_CTX_SW", name: "Context Switch", details: "-50 XP Applied" },
    { timestamp: "13:45:12", code: "ERR_FCS_BRK", name: "Focus Break > 30s", details: "Multiplier Reset to 1.0x" },
    { timestamp: "11:20:05", code: "ERR_UNAUTH", name: "Unauthorized App Launch", details: "Access Blocked" }
  ]);

  // Keep single Buy Break Time in vaultItems
  const vaultItems: AppVaultItem[] = [
    { id: "breaktime", name: "BREAK TIME", cost: 1500, unlocked: breakTimeRemaining > 0, timerRemaining: breakTimeRemaining, icon: "coffee" }
  ];

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([
    { timestamp: "2026-07-17 19:20:01", type: "SYSTEM", code: "SYS_INIT", message: "Prodo Core Engine Initialized." },
    { timestamp: "2026-07-17 19:22:05", type: "SUCCESS", code: "SYS_SYNC", message: "Linked with neural network database." }
  ]);

  const sessionInterval = useRef<any>(null);
  const cvIntervalRef     = useRef<any>(null);
  const cvStreamRef       = useRef<MediaStream | null>(null);
  const cvVideoRef        = useRef<HTMLVideoElement | null>(null);
  const cvCanvasRef       = useRef<HTMLCanvasElement | null>(null);

  // Refs for callbacks
  const graceDurationRef = useRef(graceDuration);
  const basePenaltyRef   = useRef(basePenalty);
  const multiplierRef    = useRef(multiplier);

  useEffect(() => { graceDurationRef.current = graceDuration; }, [graceDuration]);
  useEffect(() => { basePenaltyRef.current = basePenalty; }, [basePenalty]);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);

  // Format Helper
  const getTimestamp = () => {
    const d = new Date();
    return d.toTimeString().split(" ")[0];
  };

  const getFullTimestamp = () => {
    const d = new Date();
    return `${d.toISOString().split("T")[0]} ${d.toTimeString().split(" ")[0]}`;
  };

  const appendLog = (type: SystemLog["type"], code: string, message: string) => {
    setSystemLogs(prev => [
      { timestamp: getFullTimestamp(), type, code, message },
      ...prev
    ]);
  };

  const startTracking = () => {
    if (isTracking) return;
    setIsTracking(true);
    setTrackingStatus("UNCERTAIN");
    setNetLink(0);
    setCoreTemp(38);
    setThreatSeconds(graceDurationRef.current);
    appendLog("SYSTEM", "FCS_START", "Focus session initiated. Camera starting...");
  };

  const stopTracking = () => {
    if (!isTracking) return;
    setIsTracking(false);
    setTrackingStatus("UNCERTAIN");
    setNetLink(0);
    setCoreTemp(36);
    setMultiplier(1.0);
    appendLog("INFO", "FCS_STOP", "Focus session stopped.");
  };

  // Purchase break time scaling with XP required (5 XP per second)
  const purchaseBreakTime = (seconds: number): boolean => {
    const cost = seconds * 5;
    if (xp < cost) {
      appendLog("ERROR", "ERR_XP_LACK", `Insufficient XP to buy ${seconds}s break time (Costs ${cost} XP).`);
      return false;
    }
    setXp(prev => prev - cost);
    setBreakTimeRemaining(prev => prev + seconds);
    appendLog("SUCCESS", "VLT_BREAK", `Bypassed restriction! Gained +${seconds} seconds of break time.`);
    return true;
  };

  // Backwards compatible purchaseApp
  const purchaseApp = (id: string) => {
    if (id === "breaktime") {
      purchaseBreakTime(300); // default to 5 mins
    }
  };

  // Command Line override command execution
  const executeCommand = (cmd: string): string => {
    const parts = cmd.trim().split(" ");
    const command = parts[0].toLowerCase();
    
    appendLog("INFO", "CMD_EXEC", `Shell executed: ${cmd}`);

    switch (command) {
      case "help":
        return "Available commands: help, start, stop, unlock breaktime, addxp <val>, clear";
      case "start":
        startTracking();
        return "Initiating neural focus links...";
      case "stop":
        stopTracking();
        return "Deactivating focus systems.";
      case "unlock":
        if (parts[1] === "breaktime") {
          purchaseBreakTime(300);
          return "Initiating break bypass for 300s...";
        }
        return "ERR: unknown process bypass.";
      case "addxp":
        const val = parseInt(parts[1]);
        if (isNaN(val)) return "ERR: addxp requires numeric value.";
        setXp(prev => prev + val);
        apiSync(val, multiplierRef.current).catch(() => {});
        return `Added ${val} focus XP points to core node bank.`;
      case "clear":
        return "SYSTEM_SHELL_CLEAR";
      default:
        return `ERR: Command not recognized: '${command}'. Type 'help' for support.`;
    }
  };

  // Dismiss phone warning overlay
  const dismissPhoneWarning = () => {
    setPhoneWarning(false);
    phoneDetectedCountRef.current = 0;
  };

  // ── CV: Capture Canvas Frame and send to Backend ──────────────────────────
  const captureAndSendFrame = () => {
    const video  = cvVideoRef.current;
    const canvas = cvCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        const data = await apiCheckFocus(blob, "web-session", false);

        setLatestFrame(dataUrl);

        const status: "FOCUSED" | "DISTRACTED" | "UNCERTAIN" = data.status ?? "UNCERTAIN";
        const focusScore: number  = data.rolling_focus_score ?? 0;
        const facePresence: number = data.signals?.face_presence ?? 0;
        const phoneDetected: boolean = data.phone === true;

        // Track consecutive phone detection frames
        if (phoneDetected) {
          phoneDetectedCountRef.current += 1;
          if (phoneDetectedCountRef.current >= 3 && !phoneWarning) {
            setPhoneWarning(true);
            // Apply 3x heavy penalty immediately
            const penalty = basePenaltyRef.current * 3;
            setXp(prevXp => prevXp - penalty);
            setMultiplier(1.0);
            apiSync(-penalty, 1.0).catch(() => {});
            setInfractions(prevInf => [
              { timestamp: getTimestamp(), code: "ERR_PHONE_DET", name: "Phone Detected", details: `-${penalty} XP Applied` },
              ...prevInf
            ]);
            appendLog("ERROR", "ERR_PHONE", `Phone detected for 3+ consecutive frames. Heavy penalty applied (-${penalty} XP).`);
          }
        } else {
          phoneDetectedCountRef.current = 0;
        }

        setTrackingStatus(status);
        setNetLink(Math.round(focusScore * 100));
        setCoreTemp(Math.round(37 + facePresence * 8));

        if (status === "DISTRACTED") {
          appendLog("ERROR", "ERR_GAZE_LOST", `Gaze lost. Focus: ${(focusScore * 100).toFixed(0)}%. Grace timer active.`);
        } else if (status === "FOCUSED") {
          setThreatSeconds(graceDurationRef.current);
        }

      } catch {
        setNetLink(0);
        setTrackingStatus("UNCERTAIN");
      }
    }, "image/jpeg", 0.75);
  };

  // ── Camera Stream Lifecycle ─────────────────────────────────────────────────
  useEffect(() => {
    const isCameraActive = isAuthenticated && (isTracking || isCalibrating);

    if (!isCameraActive) {
      if (cvIntervalRef.current) {
        clearInterval(cvIntervalRef.current);
        cvIntervalRef.current = null;
      }
      if (cvStreamRef.current) {
        cvStreamRef.current.getTracks().forEach(t => t.stop());
        cvStreamRef.current = null;
      }
      cvVideoRef.current = null;
      cvCanvasRef.current = null;
      setLatestFrame(null);
      setCamLoading(false);
      return;
    }

    setCamErr(null);
    setCamLoading(true);

    const constraints: MediaStreamConstraints = {
      video: cameraDevice
        ? { deviceId: { exact: cameraDevice } }
        : { facingMode: "user" }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(async (stream) => {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;

        const canvas = document.createElement("canvas");
        cvStreamRef.current = stream;
        cvVideoRef.current  = video;
        cvCanvasRef.current = canvas;

        video.addEventListener("canplay", async () => {
          appendLog("SUCCESS", "CAM_READY", "Camera feed active. Starting frame capture loop → /check-focus.");
          setCamLoading(false);

          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === "videoinput");
            setAvailableDevices(videoDevices);

            if (!cameraDevice && videoDevices.length > 0) {
              const activeTrackLabel = stream.getVideoTracks()[0]?.label;
              const matched = videoDevices.find(d => d.label === activeTrackLabel);
              if (matched) setCameraDevice(matched.deviceId);
            }
          } catch (e) {
            console.error("Enumerate devices error:", e);
          }

          if (cvIntervalRef.current) clearInterval(cvIntervalRef.current);
          cvIntervalRef.current = setInterval(captureAndSendFrame, 1000);
        }, { once: true });

        video.play().catch(err => {
          setCamLoading(false);
          appendLog("ERROR", "CAM_PLAY_FAIL", `Camera video playback failed: ${err.message}`);
        });
      })
      .catch(err => {
        setCamLoading(false);
        console.error("getUserMedia error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCamErr("❌ CAM_PERM_DENIED: Camera access blocked. Enable in settings.");
        } else if (err.name === "NotFoundError") {
          setCamErr("❌ CAM_NOT_FOUND: No camera device detected.");
        } else if (err.name === "NotReadableError") {
          setCamErr("❌ CAM_IN_USE: Camera already in use by another application.");
        } else {
          setCamErr(`❌ CAM_ERR: ${err.message || "Unknown camera error."}`);
        }
        appendLog("ERROR", "CAM_FAIL", `Camera access failed: ${err.message}.`);
      });

    return () => {
      if (cvIntervalRef.current) {
        clearInterval(cvIntervalRef.current);
        cvIntervalRef.current = null;
      }
      if (cvStreamRef.current) {
        cvStreamRef.current.getTracks().forEach(t => t.stop());
        cvStreamRef.current = null;
      }
      cvVideoRef.current = null;
      cvCanvasRef.current = null;
    };
  }, [isTracking, isCalibrating, cameraDevice, isAuthenticated]);

  // Session timer + XP accumulation
  const syncCounterRef = useRef(0);
  useEffect(() => {
    if (isTracking && isAuthenticated) {
      sessionInterval.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
        
        // Decr break time
        setBreakTimeRemaining(prev => Math.max(0, prev - 1));

        const isCamOn = !!latestFrameRef.current && !camErrRef.current;
        setMultiplier(prev => {
          const climb = (isCoopActive && isCamOn) ? 0.01 : 0.002;
          const next = parseFloat((prev + climb).toFixed(3));
          const maxMult = (isCoopActive && isCamOn) ? 8.5 : 4.5;
          return next > maxMult ? maxMult : next;
        });

        // XP accumulation based on multiplier
        setXp(prev => {
          if (trackingStatus !== "FOCUSED" && breakTimeRemaining === 0) return prev;
          const earned = Math.round(1 * multiplierRef.current);
          const boosted = (isCoopActive && isCamOn) ? Math.round(earned * 5.0) : earned;
          
          syncCounterRef.current += 1;
          if (syncCounterRef.current % 30 === 0) {
            apiSync(earned * 30, multiplierRef.current, isCamOn).catch(() => {/* non-fatal */});
          }
          return prev + boosted;
        });
      }, 1000);
    } else {
      if (sessionInterval.current) clearInterval(sessionInterval.current);
      setSessionTime(0);
    }

    return () => {
      if (sessionInterval.current) clearInterval(sessionInterval.current);
    };
  }, [isTracking, isCoopActive, trackingStatus, breakTimeRemaining, isAuthenticated]);

  // Threat decay timer
  useEffect(() => {
    let interval: any = null;
    if (isTracking && isAuthenticated && trackingStatus === "DISTRACTED" && breakTimeRemaining === 0) {
      interval = setInterval(() => {
        setThreatSeconds(prev => {
          if (prev <= 1) {
            setMultiplier(1.0);
            const penalty = basePenaltyRef.current;
            setXp(prevXp => prevXp - penalty);
            setInfractions(prevInf => [
              { timestamp: getTimestamp(), code: "ERR_FCS_BRK", name: "Focus Break", details: `-${penalty} XP Applied` },
              ...prevInf
            ]);
            appendLog("ERROR", "ERR_FCS_FAIL", `Focus grace period expired. Distraction penalty applied (-${penalty} XP).`);
            return graceDurationRef.current;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setThreatSeconds(graceDurationRef.current);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, trackingStatus, breakTimeRemaining, isAuthenticated]);

  return (
    <FocusContext.Provider value={{
      xp, coreTemp, multiplier, netLink, threatSeconds, isTracking, trackingStatus,
      infractions, vaultItems, systemLogs, gazeTolerance, graceDuration, basePenalty, cameraDevice,
      sessionTime, isCoopActive, setIsCoopActive, isAuthenticated, setIsAuthenticated,
      startTracking, stopTracking, purchaseApp, purchaseBreakTime, breakTimeRemaining,
      setGazeTolerance, setGraceDuration, setBasePenalty, setCameraDevice, executeCommand,
      // CV
      latestFrame, isCalibrating, availableDevices, camErr, camLoading, setIsCalibrating,
      // Phone detection
      phoneWarning, dismissPhoneWarning,
      username, email,
    }}>
      {children}
    </FocusContext.Provider>
  );
};
