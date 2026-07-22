import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";
import { apiDeviceCodeApprove } from "../api/prodoApi";

const AuthorizeDesktopPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, username, email } = useFocus();

  const code = searchParams.get("code") || searchParams.get("device_code") || "";
  const [isApproving, setIsApproving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login if user is not logged in first
      sessionStorage.setItem("prodo_redirect_auth", window.location.hash);
    }
  }, [isAuthenticated]);

  const handleApprove = async () => {
    if (!code) {
      setErrorMsg("Missing device authorization code.");
      return;
    }

    setIsApproving(true);
    setErrorMsg(null);
    try {
      const res = await apiDeviceCodeApprove(code);
      if (res.success) {
        setSuccessMsg("✓ Prodo Desktop App authorized successfully! You can close this window.");
      } else {
        setErrorMsg(`❌ Authorization failed: ${res.message}`);
      }
    } catch (err: any) {
      setErrorMsg(`❌ Error: ${err.message || "Failed to authorize device"}`);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-on-surface flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant p-8 flex flex-col items-center gap-6 text-center shadow-2xl">
        <div className="w-16 h-16 bg-surface-variant flex items-center justify-center border border-outline-variant rounded-full">
          <span className="material-symbols-outlined text-[36px] text-amber">desktop_windows</span>
        </div>

        <div>
          <h1 className="font-value-lg text-[28px] text-primary uppercase tracking-wider">AUTHORIZE DESKTOP APP</h1>
          <p className="font-technical-prefix text-[10px] text-outline-variant mt-1 uppercase tracking-widest">
            SEAMLESS TAURI OAUTH HANDOFF
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="flex flex-col gap-4 w-full">
            <p className="font-log-body text-sm text-on-surface-variant">
              Please sign in to your Prodo account to authorize the desktop application.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-amber hover:bg-amber-400 text-background font-technical-prefix text-xs font-bold uppercase transition-colors"
            >
              Sign In to Continue
            </button>
          </div>
        ) : successMsg ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="bg-emerald/10 border border-emerald p-4 text-emerald font-technical-prefix text-xs uppercase w-full">
              {successMsg}
            </div>
            <button
              onClick={() => navigate("/focus")}
              className="w-full py-3 bg-surface-container-high border border-outline-variant hover:border-primary text-primary font-technical-prefix text-xs uppercase transition-colors"
            >
              Return to Focus Dashboard
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full">
            <div className="bg-background border border-outline-variant p-4 text-left flex flex-col gap-2">
              <div className="font-technical-prefix text-[8px] text-outline-variant uppercase">AUTHENTICATED OPERATOR</div>
              <div className="font-log-body text-primary font-bold text-sm">{username}</div>
              <div className="font-technical-prefix text-[10px] text-outline-variant">{email}</div>
            </div>

            <p className="font-log-body text-xs text-on-surface-variant leading-relaxed">
              <strong>Prodo Desktop</strong> is requesting permission to link with your Prodo account. Do you authorize this device?
            </p>

            {errorMsg && (
              <div className="bg-crimson/10 border border-crimson p-3 text-crimson font-technical-prefix text-xs uppercase">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-4 w-full">
              <button
                onClick={() => navigate("/focus")}
                className="flex-1 py-3 bg-surface-container-high border border-outline-variant text-outline hover:text-primary font-technical-prefix text-xs uppercase transition-colors"
              >
                Deny
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1 py-3 bg-emerald hover:bg-green-400 text-background font-technical-prefix text-xs font-bold uppercase transition-colors"
              >
                {isApproving ? "Authorizing..." : "Grant Access"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorizeDesktopPage;
