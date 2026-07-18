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
      setErrorMsg("❌ Key field cannot be empty.");
      return;
    }
    sessionStorage.setItem("prodo_token", val);
    setIsAuthenticated(true);
    startTracking();
    navigate("/focus");
  };

  const handleOpenWeb = () => {
    openUrl("https://prodo.live").catch((err: any) => {
      console.error("Failed to open web link:", err);
      window.open("https://prodo.live", "_blank");
    });
  };

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-on-surface flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        
        {/* Simple Brand */}
        <h1 
          onClick={handleLogoClick}
          className="font-value-xl text-[54px] leading-none text-primary uppercase tracking-widest drop-shadow-[0_0_8px_rgba(229,226,225,0.3)] cursor-pointer select-none"
        >
          PRODO
        </h1>

        {/* Action Panel */}
        <div className="w-full flex flex-col gap-4 justify-center items-center">
          {errorMsg && (
            <div className="w-full bg-[#1C0000] border border-crimson p-3 text-xs text-crimson font-technical-prefix uppercase text-center leading-normal">
              {errorMsg}
            </div>
          )}
          
          <button
            type="button"
            onClick={handleOpenWeb}
            className="w-full py-3 bg-amber text-background font-technical-prefix text-xs font-bold uppercase hover:bg-amber-400 btn-tactical transition-colors"
          >
            Sign in with Google (Web)
          </button>

          <div className="flex gap-2 w-full mt-2">
            <input
              type="text"
              placeholder="Paste Web Key..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-grow bg-background border border-outline-variant text-on-surface px-3 py-2 font-technical-prefix text-xs outline-none focus:border-amber"
            />
            <button
              type="button"
              onClick={handleImportToken}
              className="px-4 py-2 bg-emerald text-background font-technical-prefix text-xs font-bold uppercase hover:bg-green-400 transition-colors"
            >
              Sync
            </button>
          </div>
        </div>

        {/* Dynamic API Base Override */}
        {showApiConfig && (
          <div className="w-full border border-outline-variant bg-background/50 p-4 flex flex-col gap-2">
            <label className="font-technical-prefix text-[8px] text-outline-variant tracking-wider uppercase">
              API Endpoint
            </label>
            <div className="flex border border-outline-variant bg-background items-center px-3 h-8">
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

      </div>
    </div>
  );
};

export default LoginPage;
