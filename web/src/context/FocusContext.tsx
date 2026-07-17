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

  const sessionInterval = useRef<any>(null);
  const simulationInterval = useRef<any>(null);

  // Format Helper
  const getTimestamp = () => {
    const d = new Date();
    return d.toTimeString().split(" ")[0];
  };

  const getFullTimestamp = () => {
    const d = new Date();
    const dateStr = d.toISOString().split("T")[0];
    const timeStr = d.toTimeString().split(" ")[0];
    return `${dateStr} ${timeStr}`;
  };

  // Start Focus Tracking
  const startTracking = () => {
    if (isTracking) return;
    setIsTracking(true);
    setTrackingStatus("FOCUSED");
    setNetLink(99);
    setCoreTemp(38);
    setThreatSeconds(graceDuration);
    
    // Log start
    setSystemLogs(prev => [
      { timestamp: getFullTimestamp(), type: "SYSTEM", code: "FCS_START", message: "Continuous focus session initiated." },
      ...prev
    ]);
  };

  // Stop Focus Tracking
  const stopTracking = () => {
    if (!isTracking) return;
    setIsTracking(false);
    setTrackingStatus("UNCERTAIN");
    setNetLink(0);
    setCoreTemp(36);
    setMultiplier(1.0);
    
    // Log stop
    setSystemLogs(prev => [
      { timestamp: getFullTimestamp(), type: "INFO", code: "FCS_STOP", message: "Focus session stopped by operator." },
      ...prev
    ]);
  };

  // Purchase apps from vault
  const purchaseApp = (id: string) => {
    const item = vaultItems.find(i => i.id === id);
    if (!item) return;

    if (xp < item.cost) {
      setSystemLogs(prev => [
        { timestamp: getFullTimestamp(), type: "ERROR", code: "ERR_XP_LACK", message: `Insufficient points to bypass restriction for ${item.name}.` },
        ...prev
      ]);
      return;
    }

    setXp(prev => prev - item.cost);
    setVaultItems(prev => prev.map(i => {
      if (i.id === id) {
        return { ...i, unlocked: true, timerRemaining: 300 }; // Unlocks for 5 mins (300s)
      }
      return i;
    }));

    setSystemLogs(prev => [
      { timestamp: getFullTimestamp(), type: "SUCCESS", code: "VLT_BYPASS", message: `Unlocked restriction bypass for ${item.name} (300 seconds).` },
      ...prev
    ]);
  };

  // Command Line override command execution
  const executeCommand = (cmd: string): string => {
    const parts = cmd.trim().split(" ");
    const command = parts[0].toLowerCase();
    
    setSystemLogs(prev => [
      { timestamp: getFullTimestamp(), type: "INFO", code: "CMD_EXEC", message: `Shell executed: ${cmd}` },
      ...prev
    ]);

    switch (command) {
      case "help":
        return "Available commands: help, start, stop, unlock <app_name>, addxp <val>, clear";
      case "start":
        startTracking();
        return "Initiating neural focus links...";
      case "stop":
        stopTracking();
        return "Deactivating focus systems.";
      case "unlock":
        if (!parts[1]) return "ERR: unlock requires application name.";
        const appName = parts[1].toUpperCase();
        const found = vaultItems.find(i => i.name === appName);
        if (!found) return `ERR: App ${appName} not found in vault.`;
        purchaseApp(found.id);
        return `Initiating authorization protocol for ${appName}...`;
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
        
        // Multiplier progression
        setMultiplier(prev => {
          const next = parseFloat((prev + 0.002).toFixed(3)); // slower climb
          return next > 4.5 ? 4.5 : next;
        });

        // XP accumulation based on multiplier
        setXp(prev => {
          const earned = Math.round(1 * multiplierRef.current);
          // Sync to backend every 30 seconds
          syncCounterRef.current += 1;
          if (syncCounterRef.current % 30 === 0) {
            apiSync(earned * 30, multiplierRef.current).catch(() => {/* non-fatal */});
          }
          return prev + earned;
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
        // 10% chance to simulate user looking away
        const chance = Math.random();
        if (chance > 0.90) {
          setTrackingStatus("DISTRACTED");
          setNetLink(0);
          setSystemLogs(prev => [
            { timestamp: getFullTimestamp(), type: "ERROR", code: "ERR_GAZE_LOST", message: "Gaze contact lost. Grace timer initiated." },
            ...prev
          ]);
        } else if (chance > 0.60 && trackingStatus === "DISTRACTED") {
          // Recover
          setTrackingStatus("FOCUSED");
          setNetLink(99);
          setThreatSeconds(graceDuration);
          setSystemLogs(prev => [
            { timestamp: getFullTimestamp(), type: "SUCCESS", code: "GAZE_RECON", message: "Gaze contact re-established." },
            ...prev
          ]);
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
  }, [isTracking, multiplier, trackingStatus, graceDuration]);

  // Threat decay timer
  useEffect(() => {
    let interval: any = null;
    if (isTracking && trackingStatus === "DISTRACTED") {
      interval = setInterval(() => {
        setThreatSeconds(prev => {
          if (prev <= 1) {
            // Apply penalty but do NOT stop tracking or camera. Keep loop active.
            setMultiplier(1.0);
            
            // Apply Penalty (allowing negative XP)
            const penalty = basePenalty;
            setXp(prevXp => prevXp - penalty);
            setInfractions(prevInf => [
              { timestamp: getTimestamp(), code: "ERR_FCS_BRK", name: "Focus Break", details: `-${penalty} XP Applied` },
              ...prevInf
            ]);
            setSystemLogs(prevLogs => [
              { timestamp: getFullTimestamp(), type: "ERROR", code: "ERR_FCS_FAIL", message: `Focus grace period expired. Distraction penalty applied (-${penalty} XP).` },
              ...prevLogs
            ]);
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
  }, [isTracking, trackingStatus, basePenalty, graceDuration]);

  // Vault countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setVaultItems(prev => prev.map(item => {
        if (item.unlocked && item.timerRemaining !== undefined) {
          if (item.timerRemaining <= 1) {
            // Relock
            setSystemLogs(prevLogs => [
              { timestamp: getFullTimestamp(), type: "SYSTEM", code: "VLT_LOCK", message: `Bypass authorization window closed for ${item.name}. Re-locking process.` },
              ...prevLogs
            ]);
            return { ...item, unlocked: false, timerRemaining: undefined };
          }
          return { ...item, timerRemaining: item.timerRemaining - 1 };
        }
        return item;
      }));
    }, 1000);

    return () => clearInterval(timer);
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
