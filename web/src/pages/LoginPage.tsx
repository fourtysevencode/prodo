import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";
import { apiLogin } from "../api/prodoApi";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { startTracking } = useFocus();

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
        startTracking();
        navigate("/focus");
      } else {
        setErrorMsg("❌ AUTH_DENIED: Server rejected the credentials.");
      }
    } catch (err: any) {
      // Fall back to local demo mode when the API server is offline
      if (password.length >= 4) {
        sessionStorage.setItem("prodo_token", "demo-local-token");
        startTracking();
        navigate("/focus");
      } else {
        setErrorMsg("❌ AUTH_FAIL: Cannot reach server and passphrase too short for demo mode (min 4 chars).");
      }
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="font-value-xl text-[42px] leading-none text-primary uppercase tracking-widest drop-shadow-[0_0_5px_rgba(229,226,225,0.4)]">
            PRODO
          </h1>
          <p className="font-technical-prefix text-[8px] text-outline-variant uppercase tracking-widest">
            Gamified Neural Focus Engine Interface
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="p-6 flex flex-col gap-5">
          {errorMsg && (
            <div className="bg-[#1C0000] border border-crimson p-3 text-xs text-crimson font-technical-prefix uppercase">
              {errorMsg}
            </div>
          )}

          {/* Username Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-technical-prefix text-[10px] text-outline-variant uppercase tracking-wider">
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
            <label className="font-technical-prefix text-[10px] text-outline-variant uppercase tracking-wider">
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
