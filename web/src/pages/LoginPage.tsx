import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";
import { apiGoogleLogin, getApiBaseUrl, setApiBaseUrl } from "../api/prodoApi";

const LoginPage: React.FC = () => {
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

  const handleGoogleCredentialResponse = async (response: any) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiGoogleLogin(response.credential);
      if (res.success && res.token) {
        sessionStorage.setItem("prodo_token", res.token);
        setIsAuthenticated(true);
        startTracking();
        navigate("/focus");
      } else {
        setErrorMsg("❌ AUTH_DENIED: Google authentication verification failed.");
      }
    } catch (e: any) {
      setErrorMsg(`❌ AUTH_FAIL: Could not reach server: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let intervalId: any = null;

    const initGoogleGSI = () => {
      if (typeof window !== "undefined" && (window as any).google) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: "635706171491-oesrkv4sc5u9dkjc0903cp6ml4bdmi3r.apps.googleusercontent.com",
            callback: handleGoogleCredentialResponse,
          });
          
          const btn = document.getElementById("google-signin-button");
          if (btn) {
            (window as any).google.accounts.id.renderButton(
              btn,
              { theme: "dark", size: "large", width: 320 }
            );
            
            // Successfully rendered: clear the loop
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
        } catch (e) {
          console.error("Google accounts render error:", e);
        }
      }
    };

    initGoogleGSI();
    if (typeof window !== "undefined" && !(window as any).google) {
      intervalId = setInterval(initGoogleGSI, 500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-on-surface flex items-center justify-center font-log-body p-6 select-none">
      <div className="w-full max-w-sm border-2 border-outline flex flex-col bg-surface-container-lowest shadow-2xl shadow-black/80">
        
        {/* Terminal Header */}
        <div className="border-b border-outline-variant bg-[#141313] px-4 py-2 flex justify-between items-center text-xs font-technical-prefix text-outline-variant">
          <span>PRODO_SECURITY_GATEWAY_V2.0</span>
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
        <div className="p-8 flex flex-col gap-6 items-center justify-center min-h-[140px]">
          {errorMsg && (
            <div className="w-full bg-[#1C0000] border border-crimson p-3 text-xs text-crimson font-technical-prefix uppercase text-center leading-normal">
              {errorMsg}
            </div>
          )}

          {isSubmitting ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <span className="w-6 h-6 border-2 border-outline-variant border-t-primary animate-spin rounded-full"></span>
              <span className="font-technical-prefix text-[10px] text-outline-variant tracking-wider uppercase">Authenticating...</span>
            </div>
          ) : (
            <div id="google-signin-button" className="w-full flex justify-center min-h-[40px]"></div>
          )}
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
