import React, { createContext, useContext, useState, useEffect } from "react";
import { apiSync, apiGetMe, getCvBaseUrl } from "../api/prodoApi";
import { TesterWidget } from "../components/TesterWidget";

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
  // Theme & Dev Mode Controls
  theme: "dark" | "light";
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
  isDev: boolean;
  setIsDev: (val: boolean) => void;
  // Tester Mode
  isTester: boolean;
  adjustXp: (amount: number) => void;
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
  const [multiplier] = useState(1.0);
  const [netLink] = useState(0);
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

  // Theme Management ("dark" | "light")
  const [theme, setThemeState] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("prodo_theme") as "dark" | "light") || "dark";
  });

  // Developer Role Flag
  const [isDev, setIsDev] = useState<boolean>(() => {
    return localStorage.getItem("prodo_is_dev") === "true" || localStorage.getItem("prodo_role") === "dev";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("prodo_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: "dark" | "light") => {
    setThemeState(newTheme);
  };

  useEffect(() => {
    if (isAuthenticated) {
      apiGetMe()
        .then(profile => {
          setUsername(profile.user?.username || "");
          setEmail(profile.user?.email || "");
          setXp(profile.user?.current_balance || 0);
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

  // Phone Detection Warning Modal
  const [phoneWarning, setPhoneWarning] = useState(false);
  const dismissPhoneWarning = () => setPhoneWarning(false);

  // Mock Infractions Log
  const [infractions] = useState<Infraction[]>([]);

  // System Logs Feed
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: "SYSTEM",
      code: "SYS_INIT_001",
      message: "Prodo Focus Engine initialized successfully."
    }
  ]);

  // App Vault Store Items
  const [vaultItems, setVaultItems] = useState<AppVaultItem[]>([
    { id: "app-youtube", name: "YouTube Premium", cost: 150, unlocked: false, icon: "smart_display" },
    { id: "app-steam", name: "Steam Gaming Pass", cost: 300, unlocked: false, icon: "sports_esports" },
    { id: "app-discord", name: "Discord Lounge", cost: 100, unlocked: false, icon: "forum" },
    { id: "app-[#0047AB]", name: "Netflix Stream", cost: 200, unlocked: false, icon: "movie" },
  ]);

  // Enumerate Webcams
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const videoInputs = devices.filter(d => d.kind === "videoinput");
      setAvailableDevices(videoInputs);
      if (videoInputs.length > 0 && !cameraDevice) {
        setCameraDevice(videoInputs[0].deviceId);
      }
    }).catch(err => console.error("Error enumerating devices:", err));
  }, []);

  // WebRTC / Vision Inference Loop
  useEffect(() => {
    let stream: MediaStream | null = null;
    let animFrame: number;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");

    if (isTracking) {
      setCamLoading(true);
      setCamErr(null);

      navigator.mediaDevices.getUserMedia({
        video: cameraDevice ? { deviceId: { exact: cameraDevice } } : true
      }).then(s => {
        stream = s;
        setCamLoading(false);
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();

        let lastSent = 0;
        const processFrame = () => {
          const now = Date.now();
          if (now - lastSent > 800 && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.drawImage(video, 0, 0, 320, 240);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
            setLatestFrame(dataUrl);

            // Dispatch frame to CV Inference Engine via FormData
            canvas.toBlob((blob) => {
              if (!blob) return;
              const formData = new FormData();
              formData.append("frame", blob, "frame.jpg");
              formData.append("sessionId", "default");
              formData.append("includeDebug", "false");

              fetch(`${getCvBaseUrl()}/check-focus`, {
                method: "POST",
                body: formData
              })
                .then(res => res.json())
                .then(res => {
                  if (res.status === "DISTRACTED") {
                    setTrackingStatus("DISTRACTED");
                    setThreatSeconds(prev => Math.max(0, prev - 1));
                  } else if (res.status === "PHONE_DETECTED") {
                    setTrackingStatus("DISTRACTED");
                    setPhoneWarning(true);
                  } else {
                    setTrackingStatus("FOCUSED");
                    setThreatSeconds(15);
                  }
                })
                .catch(err => console.error("CV Server Error:", err));
            }, "image/jpeg", 0.5);

            lastSent = now;
          }
          animFrame = requestAnimationFrame(processFrame);
        };
        processFrame();
      }).catch(err => {
        setCamLoading(false);
        setCamErr(err.message || "Failed to access webcam device.");
      });
    }

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isTracking, cameraDevice]);

  // Session Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isTracking) {
      timer = setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isTracking]);

  // XP Accumulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTracking && trackingStatus === "FOCUSED") {
      interval = setInterval(() => setXp(x => x + 1), 3000);
    }
    return () => clearInterval(interval);
  }, [isTracking, trackingStatus]);

  // Backend Sync
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      apiSync(1, multiplier, isTracking).catch(err => console.error("Sync failed:", err));
    }, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, multiplier, isTracking]);


  const startTracking = () => setIsTracking(true);
  const stopTracking = () => setIsTracking(false);

  const purchaseApp = (id: string) => {
    const item = vaultItems.find(i => i.id === id);
    if (!item || xp < item.cost) return;
    setXp(x => x - item.cost);
    setVaultItems(items => items.map(i => i.id === id ? { ...i, unlocked: true } : i));
  };

  const purchaseBreakTime = (seconds: number) => {
    const cost = Math.ceil(seconds / 60) * 10;
    if (xp < cost) return false;
    setXp(x => x - cost);
    setBreakTimeRemaining(prev => prev + seconds);
    return true;
  };

  const executeCommand = (cmd: string): string => {
    const trimmed = (cmd || "").trim().toLowerCase();
    if (trimmed === "help") return "Available commands: help, status, clear, reset";
    if (trimmed === "status") return `Tracking: ${isTracking ? "ACTIVE" : "IDLE"} | XP: ${xp}`;
    if (trimmed === "clear") {
      setSystemLogs([]);
      return "Logs cleared.";
    }
    return `Unknown command '${cmd}'. Type 'help' for options.`;
  };

  const isTester = Boolean(
    (username || "").toLowerCase().startsWith("tester_") ||
    localStorage.getItem("prodo_token")?.startsWith("tester_token_")
  );

  const adjustXp = (amount: number) => {
    setXp(prev => prev + amount);
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
        theme,
        toggleTheme,
        setTheme,
        isDev,
        setIsDev,
        isTester,
        adjustXp,
      }}
    >
      {children}
      <TesterWidget />
    </FocusContext.Provider>
  );
};
