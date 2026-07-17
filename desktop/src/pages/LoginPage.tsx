import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";
import { apiLogin, getApiBaseUrl, setApiBaseUrl } from "../api/prodoApi";
import { openUrl } from "@tauri-apps/plugin-opener";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState(getApiBaseUrl());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("❌ AUTH_FAIL: Operator ID and passphrase cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiLogin(username, password);
      if (res.success && res.token) {
        sessionStorage.setItem("prodo_token", res.token);
        setIsAuthenticated(true);
        startTracking();
        navigate("/focus");
      } else {
        setErrorMsg("❌ AUTH_DENIED: Server rejected the credentials.");
      }
    } catch (err: any) {
      // Fall back to local demo mode when the API server is offline and user explicitly wants demo
      if (username.trim().toLowerCase() === "demo") {
        sessionStorage.setItem("prodo_token", "demo-local-token");
        setIsAuthenticated(true);
        startTracking();
        navigate("/focus");
      } else {
        setErrorMsg("❌ CONNECTION_FAIL: Cannot reach secure gateway. For offline testing, enter operator ID 'demo'.");
      }
    } finally {
      setIsSubmitting(false);
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
    openUrl("https://prodo-live.pages.dev").catch((err: any) => {
      console.error("Failed to open web link:", err);
      window.open("https://prodo-live.pages.dev", "_blank");
    });
  };

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-on-surface flex items-center justify-center font-log-body p-6 select-none">
      <div className="w-full max-w-md border-2 border-outline flex flex-col bg-surface-container-lowest">
        
        {/* Terminal Header */}
        <div className="border-b border-outline-variant bg-[#141313] px-4 py-2 flex justify-between items-center text-xs font-technical-prefix text-outline-variant">
          <span>PRODO_SECURITY_GATEWAY_V2.0</span>
          <span className="text-crimson">RESTRICTED_ACCESS</span>
        </div>

        {/* Brand Banner */}
        <div className="p-6 text-center border-b border-surface-variant flex flex-col gap-2">
          <h1 
            onClick={handleLogoClick}
            className="font-value-xl text-[42px] leading-none text-primary uppercase tracking-widest drop-shadow-[0_0_5px_rgba(229,226,225,0.4)] cursor-pointer select-none"
          >
            PRODO
          </h1>
          <p className="font-technical-prefix text-[8px] text-outline-variant uppercase tracking-widest">
            Gamified Neural Focus Engine Interface
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="p-6 flex flex-col gap-5 pb-4">
          {errorMsg && (
            <div className="bg-[#1C0000] border border-crimson p-3 text-xs text-crimson font-technical-prefix uppercase">
              {errorMsg}
            </div>
          )}

          {/* Username Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-technical-prefix text-[10px] text-outline-variant tracking-wider">
              OPERATOR_ID (EMAIL/USER)
            </label>
            <div className="flex border border-outline-variant bg-background items-center px-3 h-10">
              <span className="font-technical-prefix text-[10px] text-outline-variant mr-2">UID&gt;</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="operator@prodo.live"
                disabled={isSubmitting}
                className="bg-transparent border-none outline-none text-xs text-primary w-full focus:ring-0 p-0 placeholder-outline-variant"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-technical-prefix text-[10px] text-outline-variant tracking-wider">
              AUTH_PASSPHRASE
            </label>
            <div className="flex border border-outline-variant bg-background items-center px-3 h-10">
              <span className="font-technical-prefix text-[10px] text-outline-variant mr-2">KEY&gt;</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="bg-transparent border-none outline-none text-xs text-primary w-full focus:ring-0 p-0 placeholder-outline-variant"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-11 font-technical-prefix font-bold uppercase transition-all flex items-center justify-center gap-2 btn-tactical ${
              isSubmitting 
                ? "bg-surface-container-high border border-outline-variant text-outline cursor-not-allowed" 
                : "bg-primary text-background hover:bg-white cursor-pointer"
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 border-2 border-outline-variant border-t-outline animate-spin rounded-full"></span>
                AUTHENTICATING...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                AUTHORIZE LINK
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center px-6 mb-2">
          <div className="flex-grow border-t border-outline-variant"></div>
          <span className="px-3 font-technical-prefix text-[8px] text-outline-variant uppercase">Google Link</span>
          <div className="flex-grow border-t border-outline-variant"></div>
        </div>

        {/* Google Import container */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <div className="border border-amber/40 bg-amber/5 p-3 text-[9px] font-technical-prefix text-amber uppercase leading-normal">
            🔒 Google OAuth restricts custom schemes (tauri://). Click below to login on our web app, copy your operator key, and paste it here:
          </div>
          
          <button
            type="button"
            onClick={handleOpenWeb}
            className="w-full py-2 bg-amber text-background font-technical-prefix text-[10px] font-bold uppercase hover:bg-amber-400"
          >
            Open Web Authentication
          </button>

          <div className="flex gap-2">
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
              className="px-4 py-1.5 bg-emerald text-background font-technical-prefix text-[10px] font-bold uppercase hover:bg-green-400"
            >
              Sync
            </button>
          </div>
        </div>

        {/* Dynamic API Base Override */}
        {showApiConfig && (
          <div className="px-6 pb-4 border-t border-outline-variant/30 pt-4 flex flex-col gap-1.5">
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
          <div>SECURE SESSION PROTOCOL 48-BIT SIGNATURE</div>
          <div>C:\SYSTEM\PRODO&gt; <span className="blink-cursor"></span></div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
