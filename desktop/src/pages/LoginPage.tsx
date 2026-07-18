import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";
import { getApiBaseUrl, setApiBaseUrl } from "../api/prodoApi";
import { openUrl } from "@tauri-apps/plugin-opener";

const LoginPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState(getApiBaseUrl());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const navigate = useNavigate();
  const { startTracking, setIsAuthenticated } = useFocus();

  const handleLogoClick = () => {
    const nextCount = clickCount + 1;
    if (nextCount >= 5) {
      setShowApiConfig(!showApiConfig);
      setClickCount(0);
    } else {
      setClickCount(nextCount);
    }
  };

  const handleImportToken = () => {
    const val = tokenInput.trim();
    if (!val) {
      setErrorMsg("❌ IMPORT_FAIL: Key field cannot be empty.");
      return;
    }
    sessionStorage.setItem("prodo_token", val);
    setIsAuthenticated(true);
    startTracking();
    navigate("/focus");
  };

  const handleOpenWeb = () => {
    // Open the primary custom domain prodo.live
    openUrl("https://prodo.live").catch((err: any) => {
      console.error("Failed to open web link:", err);
      window.open("https://prodo.live", "_blank");
    });
  };

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-on-surface flex items-center justify-center font-log-body p-6 select-none">
      <div className="w-full max-w-sm border-2 border-outline flex flex-col bg-surface-container-lowest shadow-2xl shadow-black/80">
        
        {/* Terminal Header */}
        <div className="border-b border-outline-variant bg-[#141313] px-4 py-2 flex justify-between items-center text-xs font-technical-prefix text-outline-variant">
          <span>PRODO_DESKTOP_GATEWAY_V2.0</span>
          <span className="text-emerald animate-pulse">SECURE_LINK</span>
        </div>

        {/* Brand Banner */}
        <div className="p-8 text-center border-b border-outline-variant/30 flex flex-col gap-2">
          <h1 
            onClick={handleLogoClick}
            className="font-value-xl text-[46px] leading-none text-primary uppercase tracking-widest drop-shadow-[0_0_5px_rgba(229,226,225,0.4)] cursor-pointer select-none"
          >
            PRODO
          </h1>
          <p className="font-technical-prefix text-[8px] text-outline-variant uppercase tracking-widest">
            Gamified Focus Network
          </p>
        </div>

        {/* Action Panel */}
        <div className="p-8 flex flex-col gap-5 justify-center min-h-[140px]">
          {errorMsg && (
            <div className="w-full bg-[#1C0000] border border-crimson p-3 text-xs text-crimson font-technical-prefix uppercase text-center leading-normal">
              {errorMsg}
            </div>
          )}

          <div className="border border-amber/40 bg-amber/5 p-3 text-[9px] font-technical-prefix text-amber uppercase leading-normal text-center">
            Google OAuth restrictions apply. Click below to sign in on the web client, copy your authentication key, and sync it locally:
          </div>
          
          <button
            type="button"
            onClick={handleOpenWeb}
            className="w-full py-2.5 bg-amber text-background font-technical-prefix text-[10px] font-bold uppercase hover:bg-amber-400 btn-tactical transition-colors"
          >
            Open Web Authentication
          </button>

          <div className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="PASTE WEB KEY..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-grow bg-background border border-outline-variant text-on-surface px-3 py-1.5 font-technical-prefix text-xs outline-none focus:border-amber"
            />
            <button
              type="button"
              onClick={handleImportToken}
              className="px-4 py-1.5 bg-emerald text-background font-technical-prefix text-[10px] font-bold uppercase hover:bg-green-400 transition-colors"
            >
              Sync
            </button>
          </div>
        </div>

        {/* Dynamic API Base Override */}
        {showApiConfig && (
          <div className="px-6 pb-6 border-t border-outline-variant/30 pt-4 flex flex-col gap-1.5 bg-background/50">
            <label className="font-technical-prefix text-[8px] text-outline-variant tracking-wider uppercase">
              Neural Net Gateway (API Endpoint)
            </label>
            <div className="flex border border-outline-variant bg-background items-center px-3 h-8">
              <span className="font-technical-prefix text-[8px] text-outline-variant mr-2">API&gt;</span>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => {
                  setApiEndpoint(e.target.value);
                  setApiBaseUrl(e.target.value);
                }}
                placeholder="http://127.0.0.1:8000"
                className="bg-transparent border-none outline-none text-[10px] font-technical-prefix text-primary w-full focus:ring-0 p-0 placeholder-outline-variant"
              />
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="border-t border-surface-variant p-4 bg-[#0E0E0E] text-center font-technical-prefix text-[8px] text-outline-variant flex flex-col gap-1">
          <div>SECURE SYSTEM SIGN-IN PROTOCOL</div>
          <div>C:\SYSTEM\PRODO&gt; <span className="blink-cursor"></span></div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
