import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const API_BASE = "http://127.0.0.1:8000";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  timerRemaining?: number;
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
  threatSeconds: number;
  isTracking: boolean;
  trackingStatus: "FOCUSED" | "DISTRACTED" | "UNCERTAIN";
  infractions: Infraction[];
  vaultItems: AppVaultItem[];
  systemLogs: SystemLog[];
  gazeTolerance: number;
  graceDuration: number;
  basePenalty: number;
  cameraDevice: string;
  sessionTime: number;
  startTracking: () => void;
  stopTracking: () => void;
  purchaseApp: (id: string) => void;
  setGazeTolerance: (val: number) => void;
  setGraceDuration: (val: number) => void;
  setBasePenalty: (val: number) => void;
  setCameraDevice: (val: string) => void;
  executeCommand: (cmd: string) => string;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) throw new Error("useFocus must be used within FocusProvider");
  return context;
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xp, setXp] = useState(8450);
  const [coreTemp, setCoreTemp] = useState(36);
  const [multiplier, setMultiplier] = useState(1.0);
  const [netLink, setNetLink] = useState(0);
  const [threatSeconds, setThreatSeconds] = useState(15);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<"FOCUSED" | "DISTRACTED" | "UNCERTAIN">("UNCERTAIN");

  // Config
  const [gazeTolerance, setGazeTolerance] = useState(15);
  const [graceDuration, setGraceDuration] = useState(15);
  const [basePenalty, setBasePenalty] = useState(50);
  const [cameraDevice, setCameraDevice] = useState("");

  const [sessionTime, setSessionTime] = useState(0);

  const [infractions, setInfractions] = useState<Infraction[]>([
    { timestamp: "14:02:45", code: "ERR_CTX_SW", name: "Context Switch", details: "-50 XP Applied" },
    { timestamp: "13:45:12", code: "ERR_FCS_BRK", name: "Focus Break > 30s", details: "Multiplier Reset to 1.0x" },
    { timestamp: "11:20:05", code: "ERR_UNAUTH", name: "Unauthorized App Launch", details: "Access Blocked" }
  ]);

  const [vaultItems, setVaultItems] = useState<AppVaultItem[]>([
    { id: "youtube", name: "YOUTUBE", cost: 500, unlocked: false, icon: "play_circle" },
    { id: "reddit", name: "REDDIT", cost: 350, unlocked: false, icon: "forum" },
    { id: "spotify", name: "SPOTIFY", cost: 200, unlocked: true, timerRemaining: 480, icon: "library_music" },
    { id: "steam", name: "STEAM", cost: 800, unlocked: false, icon: "sports_esports" },
    { id: "discord", name: "DISCORD", cost: 400, unlocked: false, icon: "chat" }
  ]);

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([
    { timestamp: "2026-07-17 19:20:01", type: "SYSTEM", code: "SYS_INIT", message: "Prodo Core Engine Initialized." },
    { timestamp: "2026-07-17 19:22:05", type: "SUCCESS", code: "SYS_SYNC", message: "Linked with neural network database." },
    { timestamp: "2026-07-17 21:02:45", type: "ERROR", code: "ERR_CTX_SW", message: "Operator switched context to unapproved application." }
  ]);

  // ── CV Camera Refs ──────────────────────────────────────────────────────────
  // These live as refs so they don't trigger re-renders
  const cvStreamRef   = useRef<MediaStream | null>(null);
  const cvVideoRef    = useRef<HTMLVideoElement | null>(null);
  const cvCanvasRef   = useRef<HTMLCanvasElement | null>(null);
  const cvIntervalRef = useRef<any>(null);

  // Session / XP interval
  const sessionInterval = useRef<any>(null);
  const multiplierRef   = useRef(multiplier);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);

  // Ref for graceDuration so callbacks don't close over stale value
  const graceDurationRef = useRef(graceDuration);
  useEffect(() => { graceDurationRef.current = graceDuration; }, [graceDuration]);
  const basePenaltyRef   = useRef(basePenalty);
  useEffect(() => { basePenaltyRef.current = basePenalty; }, [basePenalty]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getTimestamp = () => new Date().toTimeString().split(" ")[0];
  const getFullTimestamp = () => {
    const d = new Date();
    return `${d.toISOString().split("T")[0]} ${d.toTimeString().split(" ")[0]}`;
  };

  const appendLog = (type: SystemLog["type"], code: string, message: string) => {
    setSystemLogs(prev => [{ timestamp: getFullTimestamp(), type, code, message }, ...prev]);
  };

  // ── CV: Send a frame to /check-focus ────────────────────────────────────────

  const captureAndSendFrame = () => {
    const video  = cvVideoRef.current;
    const canvas = cvCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const form = new FormData();
      form.append("frame", blob, "frame.jpg");
      form.append("session_id", "desktop-session");
      form.append("include_debug", "false");

      try {
        const res = await fetch(`${API_BASE}/check-focus`, { method: "POST", body: form });
        if (!res.ok) return;
        const data = await res.json();

        const status: "FOCUSED" | "DISTRACTED" | "UNCERTAIN" = data.status ?? "UNCERTAIN";
        const focusScore: number  = data.rolling_focus_score ?? 0;
        const facePresence: number = data.signals?.face_presence ?? 0;

        setTrackingStatus(status);
        // netLink = rolling focus score as percentage (0–100)
        setNetLink(Math.round(focusScore * 100));
        // coreTemp = 37–45 range driven by face presence confidence
        setCoreTemp(Math.round(37 + facePresence * 8));

        if (status === "DISTRACTED") {
          appendLog("ERROR", "ERR_GAZE_LOST", `Gaze lost. Focus: ${(focusScore * 100).toFixed(0)}%. Grace timer active.`);
        } else if (status === "FOCUSED") {
          // On recovery from distracted state, reset the threat timer
          setThreatSeconds(graceDurationRef.current);
        }

      } catch {
        // Server unreachable — degrade gracefully
        setNetLink(0);
        setTrackingStatus("UNCERTAIN");
      }
    }, "image/jpeg", 0.75);
  };

  // ── startTracking ─────────────────────────────────────────────────────────

  const startTracking = () => {
    if (isTracking) return;

    const constraints: MediaStreamConstraints = {
      video: cameraDevice
        ? { deviceId: { exact: cameraDevice } }
        : { facingMode: "user" }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        // Set up hidden video element for frame capture
        const video = document.createElement("video");
        video.srcObject = stream;
        video.autoplay  = true;
        video.playsInline = true;
        video.muted    = true;

        cvStreamRef.current = stream;
        cvVideoRef.current  = video;
        cvCanvasRef.current = document.createElement("canvas");

        setIsTracking(true);
        setTrackingStatus("UNCERTAIN");
        setNetLink(0);
        setCoreTemp(38);
        setThreatSeconds(graceDurationRef.current);

        appendLog("SYSTEM", "FCS_START", "Focus session initiated. Camera online. CV model linking...");

        // Start capturing frames every 1 second
        cvIntervalRef.current = setInterval(captureAndSendFrame, 1000);
      })
      .catch(err => {
        appendLog("ERROR", "CAM_FAIL", `Camera access failed: ${err.message}. Check Config → Camera permissions.`);
      });
  };

  // ── stopTracking ───────────────────────────────────────────────────────────

  const stopTracking = () => {
    if (!isTracking) return;

    // Kill CV capture loop
    if (cvIntervalRef.current) {
      clearInterval(cvIntervalRef.current);
      cvIntervalRef.current = null;
    }

    // Release camera
    if (cvStreamRef.current) {
      cvStreamRef.current.getTracks().forEach(t => t.stop());
      cvStreamRef.current = null;
    }

    cvVideoRef.current  = null;
    cvCanvasRef.current = null;

    setIsTracking(false);
    setTrackingStatus("UNCERTAIN");
    setNetLink(0);
    setCoreTemp(36);
    setMultiplier(1.0);

    appendLog("INFO", "FCS_STOP", "Focus session stopped. Camera released.");
  };

  // ── Purchase Apps ───────────────────────────────────────────────────────────

  const purchaseApp = (id: string) => {
    const item = vaultItems.find(i => i.id === id);
    if (!item) return;

    if (xp < item.cost) {
      appendLog("ERROR", "ERR_XP_LACK", `Insufficient points to bypass restriction for ${item.name}.`);
      return;
    }

    setXp(prev => prev - item.cost);
    setVaultItems(prev => prev.map(i =>
      i.id === id ? { ...i, unlocked: true, timerRemaining: 300 } : i
    ));
    appendLog("SUCCESS", "VLT_BYPASS", `Unlocked restriction bypass for ${item.name} (300 seconds).`);
  };

  // ── Command Line ───────────────────────────────────────────────────────────

  const executeCommand = (cmd: string): string => {
    const parts   = cmd.trim().split(" ");
    const command = parts[0].toLowerCase();

    appendLog("INFO", "CMD_EXEC", `Shell executed: ${cmd}`);

    switch (command) {
      case "help":
        return "Available commands: help, start, stop, unlock <app>, addxp <val>, clear";
      case "start":
        startTracking();
        return "Initiating neural focus links...";
      case "stop":
        stopTracking();
        return "Deactivating focus systems.";
      case "unlock": {
        if (!parts[1]) return "ERR: unlock requires application name.";
        const appName = parts[1].toUpperCase();
        const found   = vaultItems.find(i => i.name === appName);
        if (!found) return `ERR: App ${appName} not found in vault.`;
        purchaseApp(found.id);
        return `Initiating authorization protocol for ${appName}...`;
      }
      case "addxp": {
        const val = parseInt(parts[1]);
        if (isNaN(val)) return "ERR: addxp requires numeric value.";
        setXp(prev => prev + val);
        return `Added ${val} focus XP to core node bank.`;
      }
      case "clear":
        return "SYSTEM_SHELL_CLEAR";
      default:
        return `ERR: Command not recognized: '${command}'. Type 'help'.`;
    }
  };

  // ── Session timer + XP accumulation (frontend-side, always run while tracking) ──

  useEffect(() => {
    if (isTracking) {
      sessionInterval.current = setInterval(() => {
        setSessionTime(prev => prev + 1);

        // Multiplier climbs the longer you're focused
        setMultiplier(prev => {
          const next = parseFloat((prev + 0.02).toFixed(2));
          return next > 4.5 ? 4.5 : next;
        });

        // XP accrues every second (1 × multiplier, only when FOCUSED)
        setXp(prev => {
          if (trackingStatus !== "FOCUSED") return prev;
          return prev + Math.round(1 * multiplierRef.current);
        });
      }, 1000);
    } else {
      if (sessionInterval.current) clearInterval(sessionInterval.current);
      setSessionTime(0);
    }

    return () => {
      if (sessionInterval.current) clearInterval(sessionInterval.current);
    };
  }, [isTracking, trackingStatus]);

  // ── Threat (grace period) decay ────────────────────────────────────────────

  useEffect(() => {
    let interval: any = null;

    if (isTracking && trackingStatus === "DISTRACTED") {
      interval = setInterval(() => {
        setThreatSeconds(prev => {
          if (prev <= 1) {
            // Grace period expired → apply penalty and force-stop
            setIsTracking(false);
            setTrackingStatus("UNCERTAIN");
            setMultiplier(1.0);
            setNetLink(0);

            // Release camera
            if (cvIntervalRef.current) clearInterval(cvIntervalRef.current);
            if (cvStreamRef.current) cvStreamRef.current.getTracks().forEach(t => t.stop());
            cvStreamRef.current = null;
            cvVideoRef.current  = null;

            const penalty = basePenaltyRef.current;
            setXp(prevXp => Math.max(0, prevXp - penalty));
            setInfractions(prevInf => [
              { timestamp: getTimestamp(), code: "ERR_FCS_BRK", name: "Focus Break", details: `-${penalty} XP Applied` },
              ...prevInf
            ]);
            appendLog("ERROR", "ERR_FCS_FAIL", `Grace period expired. Distraction penalty applied (-${penalty} XP). Camera released.`);

            return graceDurationRef.current;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (trackingStatus === "FOCUSED") {
      setThreatSeconds(graceDurationRef.current);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [isTracking, trackingStatus]);

  // ── Vault countdown ─────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      setVaultItems(prev => prev.map(item => {
        if (item.unlocked && item.timerRemaining !== undefined) {
          if (item.timerRemaining <= 1) {
            appendLog("SYSTEM", "VLT_LOCK", `Bypass authorization closed for ${item.name}. Re-locking.`);
            return { ...item, unlocked: false, timerRemaining: undefined };
          }
          return { ...item, timerRemaining: item.timerRemaining - 1 };
        }
        return item;
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (cvIntervalRef.current) clearInterval(cvIntervalRef.current);
      if (cvStreamRef.current) cvStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <FocusContext.Provider value={{
      xp, coreTemp, multiplier, netLink, threatSeconds, isTracking, trackingStatus,
      infractions, vaultItems, systemLogs, gazeTolerance, graceDuration, basePenalty, cameraDevice,
      sessionTime, startTracking, stopTracking, purchaseApp,
      setGazeTolerance, setGraceDuration, setBasePenalty, setCameraDevice, executeCommand
    }}>
      {children}
    </FocusContext.Provider>
  );
};
