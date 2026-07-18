import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { apiSync } from "../api/prodoApi";

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
  const [cameraDevice, setCameraDevice] = useState("Default Web Camera");
  const [isCoopActive, setIsCoopActive] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem("prodo_token"));
  const [sessionTime, setSessionTime] = useState(0);
  
  // Break Time variables
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);

  const [infractions, setInfractions] = useState<Infraction[]>([
    { timestamp: "14:02:45", code: "ERR_CTX_SW", name: "Context Switch", details: "-50 XP Applied" },
    { timestamp: "13:45:12", code: "ERR_FCS_BRK", name: "Focus Break > 30s", details: "Multiplier Reset to 1.0x" },
    { timestamp: "11:20:05", code: "ERR_UNAUTH", name: "Unauthorized App Launch", details: "Access Blocked" }
  ]);

  // Keep single dynamic Buy Break Time in vaultItems list for compatibility
  const vaultItems: AppVaultItem[] = [
    { id: "breaktime", name: "BREAK TIME", cost: 1500, unlocked: breakTimeRemaining > 0, timerRemaining: breakTimeRemaining, icon: "coffee" }
  ];

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([
    { timestamp: "2026-07-17 19:20:01", type: "SYSTEM", code: "SYS_INIT", message: "Prodo Core Engine Initialized." },
    { timestamp: "2026-07-17 19:22:05", type: "SUCCESS", code: "SYS_SYNC", message: "Linked with neural network database." },
    { timestamp: "2026-07-17 21:02:45", type: "ERROR", code: "ERR_CTX_SW", message: "Operator switched context to unapproved application." }
  ]);

  const sessionInterval = useRef<any>(null);
  const simulationInterval = useRef<any>(null);

  // Format Helper
  const getTimestamp = () => {
    const d = new Date();
    return d.toTimeString().split(" ")[0];
  };

  const getFullTimestamp = () => {
    const d = new Date();
    return `${d.toISOString().split("T")[0]} ${d.toTimeString().split(" ")[0]}`;
  };

  const appendLog = (type: "SYSTEM" | "ERROR" | "SUCCESS" | "INFO", code: string, message: string) => {
    setSystemLogs(prev => [
      { timestamp: getFullTimestamp(), type, code, message },
      ...prev
    ]);
  };

  const startTracking = () => {
    if (!isAuthenticated) return;
    setIsTracking(true);
    setTrackingStatus("FOCUSED");
    setNetLink(99);
    appendLog("SYSTEM", "FCS_START", "Focus calibration active. Tracker engaged.");
  };

  const stopTracking = () => {
    setIsTracking(false);
    setTrackingStatus("UNCERTAIN");
    setNetLink(0);
    setCoreTemp(36);
    setMultiplier(1.0);
    appendLog("INFO", "FCS_STOP", "Focus session stopped by operator.");
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
        return `Added ${val} focus XP points to core node bank.`;
      case "clear":
        return "SYSTEM_SHELL_CLEAR";
      default:
        return `ERR: Command not recognized: '${command}'. Type 'help' for support.`;
    }
  };

  // Timers and Simulation Effect
  const syncCounterRef = useRef(0);
  const multiplierRef = useRef(multiplier);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);

  useEffect(() => {
    if (isTracking) {
      sessionInterval.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
        
        // Decr break time
        setBreakTimeRemaining(prev => Math.max(0, prev - 1));

        // Multiplier progression
        setMultiplier(prev => {
          const climb = isCoopActive ? 0.005 : 0.002;
          const next = parseFloat((prev + climb).toFixed(3));
          return next > 4.5 ? 4.5 : next;
        });

        // XP accumulation based on multiplier
        setXp(prev => {
          const earned = Math.round(1 * multiplierRef.current);
          const boosted = isCoopActive ? Math.round(earned * 2.5) : earned;
          // Sync to backend every 30 seconds
          syncCounterRef.current += 1;
          if (syncCounterRef.current % 30 === 0) {
            apiSync(earned * 30, multiplierRef.current).catch(() => {/* non-fatal */});
          }
          return prev + boosted;
        });

        // Core Temp flux
        setCoreTemp(prev => {
          const flux = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const next = prev + flux;
          return next < 37 ? 37 : next > 45 ? 45 : next;
        });
      }, 1000);

      // Simulate Gaze and Tracking fluctuations
      simulationInterval.current = setInterval(() => {
        // Skip gaze lost simulation if break time is active
        if (breakTimeRemaining > 0) {
          setTrackingStatus("FOCUSED");
          setNetLink(99);
          return;
        }

        const chance = Math.random();
        if (chance > 0.90) {
          setTrackingStatus("DISTRACTED");
          setNetLink(0);
          appendLog("ERROR", "ERR_GAZE_LOST", "Gaze contact lost. Grace timer initiated.");
        } else if (chance > 0.60 && trackingStatus === "DISTRACTED") {
          setTrackingStatus("FOCUSED");
          setNetLink(99);
          setThreatSeconds(graceDuration);
          appendLog("SUCCESS", "GAZE_RECON", "Gaze contact re-established.");
        }
      }, 3000);
    } else {
      if (sessionInterval.current) clearInterval(sessionInterval.current);
      if (simulationInterval.current) clearInterval(simulationInterval.current);
      setSessionTime(0);
    }

    return () => {
      if (sessionInterval.current) clearInterval(sessionInterval.current);
      if (simulationInterval.current) clearInterval(simulationInterval.current);
    };
  }, [isTracking, multiplier, trackingStatus, graceDuration, breakTimeRemaining]);

  // Threat decay timer
  useEffect(() => {
    let interval: any = null;
    if (isTracking && trackingStatus === "DISTRACTED" && breakTimeRemaining === 0) {
      interval = setInterval(() => {
        setThreatSeconds(prev => {
          if (prev <= 1) {
            setMultiplier(1.0);
            const penalty = basePenalty;
            setXp(prevXp => prevXp - penalty);
            setInfractions(prevInf => [
              { timestamp: getTimestamp(), code: "ERR_FCS_BRK", name: "Focus Break", details: `-${penalty} XP Applied` },
              ...prevInf
            ]);
            appendLog("ERROR", "ERR_FCS_FAIL", `Focus grace period expired. Distraction penalty applied (-${penalty} XP).`);
            return graceDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setThreatSeconds(graceDuration);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, trackingStatus, basePenalty, graceDuration, breakTimeRemaining]);

  return (
    <FocusContext.Provider value={{
      xp, coreTemp, multiplier, netLink, threatSeconds, isTracking, trackingStatus,
      infractions, vaultItems, systemLogs, gazeTolerance, graceDuration, basePenalty, cameraDevice,
      sessionTime, isCoopActive, setIsCoopActive, isAuthenticated, setIsAuthenticated,
      startTracking, stopTracking, purchaseApp, purchaseBreakTime, breakTimeRemaining,
      setGazeTolerance, setGraceDuration, setBasePenalty, setCameraDevice, executeCommand
    }}>
      {children}
    </FocusContext.Provider>
  );
};
