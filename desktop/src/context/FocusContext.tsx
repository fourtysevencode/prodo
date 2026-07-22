import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { apiSync, apiGetMe, apiSendTelemetry, getCvBaseUrl } from "../api/prodoApi";

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
  const [coreTemp] = useState(36);
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

  // Phone detection state
  const [phoneWarning, setPhoneWarning] = useState(false);

  const [infractions] = useState<Infraction[]>([]);

  const [vaultItems, setVaultItems] = useState<AppVaultItem[]>([
    { id: "break_5m", name: "5 MIN BREAK", cost: 500, unlocked: false, icon: "coffee" },
    { id: "break_15m", name: "15 MIN BREAK", cost: 1200, unlocked: false, icon: "free_breakfast" },
  ]);

  const [systemLogs] = useState<SystemLog[]>([
    { timestamp: new Date().toLocaleTimeString(), type: "SYSTEM", code: "SYS_INIT", message: "Prodo Core Engine Initialized." },
  ]);

  // Webcam Video Stream Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera devices & stream
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoInputs = devices.filter(d => d.kind === "videoinput");
        setAvailableDevices(videoInputs);
        if (videoInputs.length > 0 && !cameraDevice) {
          setCameraDevice(videoInputs[0].deviceId);
        }
      });
    }
  }, []);



  const startTracking = async () => {
    setCamErr(null);
    setCamLoading(true);
    try {
      const constraints = {
        video: cameraDevice ? { deviceId: { exact: cameraDevice } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();
      videoRef.current = video;

      setIsTracking(true);
      setNetLink(98);
      setCamLoading(false);
      setTrackingStatus("FOCUSED");
    } catch (err: any) {
      setCamErr(err.message || "Failed to access webcam.");
      setCamLoading(false);
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    videoRef.current = null;
    setIsTracking(false);
    setNetLink(0);
    setTrackingStatus("UNCERTAIN");
  };

  // Timer & Session interval
  useEffect(() => {
    let timer: any = null;
    if (isTracking) {
      timer = setInterval(() => {
        setSessionTime(prev => prev + 1);

        // Periodically capture frame
        if (videoRef.current && videoRef.current.videoWidth > 0) {
          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
            setLatestFrame(dataUrl);

            // Frame blob POST to CV server
            canvas.toBlob(blob => {
              if (blob && isAuthenticated) {
                const formData = new FormData();
                formData.append("frame", blob, "frame.jpg");
                formData.append("session_id", username || "default");
                const cvUrl = getCvBaseUrl();
                fetch(`${cvUrl}/check-focus`, {
                  method: "POST",
                  body: formData,
                })
                  .then(res => res.json())
                  .then((data: any) => {
                    if (data.status) {
                      setTrackingStatus(data.status);
                      if (data.status === "DISTRACTED") {
                        setThreatSeconds(prev => Math.max(0, prev - 1));
                        apiSendTelemetry("DISTRACTED_SIGNAL", { score: data.focus_score, signals: data.signals });
                      } else {
                        setThreatSeconds(15);
                      }
                      if (data.phone) {
                        setPhoneWarning(true);
                      }
                    }
                  })
                  .catch(e => console.error("CV Check error:", e));
              }
            }, "image/jpeg", 0.6);
          }
        }

        // Sync points
        apiSync(1, multiplier, true)
          .then(res => {
            if (res.success) {
              setXp(prev => prev + res.points_added);
              if (res.multiplier) setMultiplier(res.multiplier);
            }
          })
          .catch(err => console.error("Sync error:", err));

      }, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTracking, multiplier, isAuthenticated, username]);

  const purchaseApp = (id: string) => {
    const item = vaultItems.find(i => i.id === id);
    if (!item || xp < item.cost) return;
    setXp(prev => prev - item.cost);
    setVaultItems(prev => prev.map(i => i.id === id ? { ...i, unlocked: true } : i));
  };

  const purchaseBreakTime = (seconds: number): boolean => {
    if (xp < 100) return false;
    setXp(prev => prev - 100);
    setBreakTimeRemaining(seconds);
    return true;
  };

  const dismissPhoneWarning = () => setPhoneWarning(false);

  const executeCommand = (cmd: string): string => {
    const clean = cmd.trim().toLowerCase();
    if (clean === "clear") return "SYSTEM_SHELL_CLEAR";
    if (clean === "status") return `TRACKING: ${isTracking ? "ACTIVE" : "INACTIVE"} | USER: ${username || "ANONYMOUS"}`;
    if (clean === "help") return "Commands: status, clear, telemetry, help";
    if (clean === "telemetry") {
      apiSendTelemetry("MANUAL_TELEMETRY_TRIGGER", { username });
      return "Telemetry logs dispatched to telemetry@prodo.live";
    }
    return `Unknown command: '${cmd}'. Type 'help' for options.`;
  };

  return (
    <FocusContext.Provider
      value={{
        xp,
        coreTemp,
        multiplier,
        netLink,
        threatSeconds,
        isTracking,
        trackingStatus,
        infractions,
        vaultItems,
        systemLogs,
        gazeTolerance,
        graceDuration,
        basePenalty,
        cameraDevice,
        sessionTime,
        username,
        email,
        isCoopActive,
        setIsCoopActive,
        isAuthenticated,
        setIsAuthenticated,
        startTracking,
        stopTracking,
        purchaseApp,
        purchaseBreakTime,
        breakTimeRemaining,
        setGazeTolerance,
        setGraceDuration,
        setBasePenalty,
        setCameraDevice,
        executeCommand,
        latestFrame,
        isCalibrating,
        availableDevices,
        camErr,
        camLoading,
        setIsCalibrating,
        phoneWarning,
        dismissPhoneWarning,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};
