import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";
import { 
  apiGoogleLogin, 
  apiLogin, 
  apiRegister, 
  apiTesterLogin, 
  apiUpdateUsername 
} from "../api/prodoApi";

const LoginPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<"google" | "login" | "register">("google");
  const [emailInput, setEmailInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [customHandle, setCustomHandle] = useState("");

  const navigate = useNavigate();
  const { startTracking, setIsAuthenticated } = useFocus();

  const handleAuthSuccess = (token: string, needsHandle?: boolean) => {
    localStorage.setItem("prodo_token", token);
    setIsAuthenticated(true);

    if (needsHandle) {
      setShowHandleModal(true);
    } else {
      startTracking();
      navigate("/focus");
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiGoogleLogin(response.credential);
      if (res.success && res.token) {
        handleAuthSuccess(res.token, res.needs_handle);
      } else {
        setErrorMsg("❌ Google authentication failed.");
      }
    } catch (e: any) {
      setErrorMsg(`❌ Could not reach server: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (authMode === "register") {
        const res = await apiRegister(usernameInput, emailInput, passwordInput);
        if (res.success && res.token) {
          handleAuthSuccess(res.token, false);
        } else {
          setErrorMsg(res.message || "Registration failed.");
        }
      } else {
        const res = await apiLogin(emailInput, passwordInput);
        if (res.success && res.token) {
          handleAuthSuccess(res.token, false);
        } else {
          setErrorMsg(res.message || "Login failed.");
        }
      }
    } catch (e: any) {
      setErrorMsg(`❌ Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTesterAccess = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiTesterLogin();
      if (res.success && res.token) {
        handleAuthSuccess(res.token, false);
      } else {
        setErrorMsg("❌ Tester session failed.");
      }
    } catch (e: any) {
      setErrorMsg(`❌ Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCustomHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHandle.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await apiUpdateUsername(customHandle);
      if (res.success) {
        setShowHandleModal(false);
        startTracking();
        navigate("/focus");
      } else {
        setErrorMsg(res.message || "Failed to set username handle.");
      }
    } catch (e: any) {
      setErrorMsg(`❌ Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let intervalId: any = null;
    const initGoogleGSI = () => {
      if (typeof window !== "undefined" && (window as any).google && authMode === "google") {
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
          }
        } catch (e) {
          console.error("Google accounts render error:", e);
        }
      }
    };

    initGoogleGSI();
    if (authMode === "google" && typeof window !== "undefined" && !(window as any).google) {
      intervalId = setInterval(initGoogleGSI, 500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [authMode]);

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-on-surface flex items-center justify-center p-6 select-none relative">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        
        {/* Simple Brand */}
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Prodo Logo" className="w-10 h-10" />
          <h1 className="font-value-xl text-[48px] leading-none text-primary uppercase tracking-widest">
            PRODO
          </h1>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex w-full border border-outline-variant bg-surface-container-lowest">
          <button
            onClick={() => setAuthMode("google")}
            className={`flex-1 py-2 font-technical-prefix text-[10px] uppercase font-bold transition-colors ${
              authMode === "google" ? "bg-surface-container-highest text-primary" : "text-outline-variant hover:text-primary"
            }`}
          >
            Google Sign-In
          </button>
          <button
            onClick={() => setAuthMode("login")}
            className={`flex-1 py-2 font-technical-prefix text-[10px] uppercase font-bold transition-colors ${
              authMode === "login" ? "bg-surface-container-highest text-primary" : "text-outline-variant hover:text-primary"
            }`}
          >
            Email Login
          </button>
          <button
            onClick={() => setAuthMode("register")}
            className={`flex-1 py-2 font-technical-prefix text-[10px] uppercase font-bold transition-colors ${
              authMode === "register" ? "bg-surface-container-highest text-primary" : "text-outline-variant hover:text-primary"
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Container */}
        <div className="w-full bg-surface-container-lowest border border-outline-variant p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="w-full bg-[#1C0000] border border-crimson p-3 text-xs text-crimson font-technical-prefix uppercase text-center">
              {errorMsg}
            </div>
          )}

          {authMode === "google" ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div id="google-signin-button" className="w-full flex justify-center min-h-[40px]"></div>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              {authMode === "register" && (
                <div className="flex flex-col gap-1">
                  <label className="font-technical-prefix text-[9px] text-outline-variant uppercase">Username Handle</label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. operator_01"
                    className="bg-surface-container-high border border-outline-variant px-3 py-2 font-log-body text-xs text-primary outline-none focus:border-primary"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="font-technical-prefix text-[9px] text-outline-variant uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="user@prodo.live"
                  className="bg-surface-container-high border border-outline-variant px-3 py-2 font-log-body text-xs text-primary outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-technical-prefix text-[9px] text-outline-variant uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="bg-surface-container-high border border-outline-variant px-3 py-2 font-log-body text-xs text-primary outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber hover:bg-amber-400 text-background font-technical-prefix text-xs font-bold uppercase transition-colors mt-2"
              >
                {isSubmitting ? "Processing..." : authMode === "register" ? "Create Account" : "Sign In"}
              </button>
            </form>
          )}

          {/* Tester Mode Link */}
          <div className="border-t border-surface-variant pt-4 mt-2 text-center">
            <button
              onClick={handleTesterAccess}
              disabled={isSubmitting}
              className="text-amber hover:underline font-technical-prefix text-xs font-bold uppercase tracking-wider"
            >
              ⚡ Are you a Tester? Click Here!
            </button>
            <div className="font-technical-prefix text-[8px] text-outline-variant mt-1">
              Provides temporary 30-minute anonymous tester access
            </div>
          </div>
        </div>

      </div>

      {/* Unique Handle Selection Modal */}
      {showHandleModal && (
        <div className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest border border-amber p-6 max-w-sm w-full flex flex-col gap-4 text-center">
            <h2 className="font-value-lg text-[22px] text-amber uppercase">CHOOSE USERNAME HANDLE</h2>
            <p className="font-log-body text-xs text-on-surface-variant leading-relaxed">
              Please choose a unique handle for your Prodo account to appear on leaderboards and friends lists.
            </p>
            <form onSubmit={handleSaveCustomHandle} className="flex flex-col gap-3">
              <input
                type="text"
                required
                value={customHandle}
                onChange={(e) => setCustomHandle(e.target.value)}
                placeholder="e.g. ivan_samuel"
                className="bg-surface-container-high border border-outline-variant px-3 py-2 font-log-body text-xs text-primary outline-none focus:border-amber text-center"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber hover:bg-amber-400 text-background font-technical-prefix text-xs font-bold uppercase transition-colors"
              >
                {isSubmitting ? "Saving..." : "Confirm Handle"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
