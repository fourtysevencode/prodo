import React, { useState, useEffect } from "react";
import { apiDevLogin, apiGetDevStats, apiGetDevTelemetry } from "../api/prodoApi";

/**
 * Full Developer Portal Page for dev.prodo.live
 * Restricted to Developer Accounts via DEV_TOKEN authorization.
 */
const DevPage: React.FC = () => {
  const [devToken, setDevToken] = useState<string>(localStorage.getItem("prodo_dev_token") || "");
  const [passphrase, setPassphrase] = useState("");
  const [devEmail, setDevEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  const handleDevAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiDevLogin(passphrase, devEmail);
      if (res.success && res.dev_token) {
        localStorage.setItem("prodo_dev_token", res.dev_token);
        setDevToken(res.dev_token);
      } else {
        setErrorMsg(res.message || "Developer authentication failed.");
      }
    } catch (err: any) {
      setErrorMsg(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchDevData = async () => {
    if (!devToken) return;
    setLoadingFeed(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        apiGetDevStats(devToken),
        apiGetDevTelemetry(devToken),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (logsRes.success) setLogs(logsRes.logs);
    } catch (err: any) {
      console.error("Dev data fetch error:", err);
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        localStorage.removeItem("prodo_dev_token");
        setDevToken("");
      }
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (devToken) {
      fetchDevData();
      const interval = setInterval(fetchDevData, 5000);
      return () => clearInterval(interval);
    }
  }, [devToken]);

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-on-surface flex flex-col overflow-hidden font-log-body select-none">
      
      {/* Dev Header */}
      <header className="h-12 border-b border-outline-variant bg-surface-container-lowest px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-amber animate-pulse"></span>
          <span className="font-value-lg text-lg text-primary tracking-widest uppercase">DEV.PRODO.LIVE</span>
          <span className="bg-amber/10 text-amber text-[9px] font-technical-prefix uppercase border border-amber/30 px-2 py-0.5 font-bold">
            DEVELOPER PORTAL
          </span>
        </div>
        {devToken && (
          <div className="flex items-center gap-4">
            <span className="font-technical-prefix text-[10px] text-outline-variant uppercase">AUTH: DEV_TOKEN_OK</span>
            <button
              onClick={() => {
                localStorage.removeItem("prodo_dev_token");
                setDevToken("");
              }}
              className="font-technical-prefix text-[9px] text-crimson hover:underline uppercase font-bold"
            >
              Sign Out Dev
            </button>
          </div>
        )}
      </header>

      {/* Main Body */}
      {!devToken ? (
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-surface-container-lowest border border-amber p-6 flex flex-col gap-5 text-center">
            <span className="material-symbols-outlined text-[48px] text-amber">terminal</span>
            <div>
              <h2 className="font-value-lg text-[22px] text-primary uppercase">DEVELOPER ACCESS REQUIRED</h2>
              <p className="font-technical-prefix text-[9px] text-outline-variant uppercase tracking-wider mt-1">
                Enter dev credentials to access dev.prodo.live
              </p>
            </div>

            {errorMsg && (
              <div className="bg-crimson/10 border border-crimson p-2 text-[10px] text-crimson font-technical-prefix uppercase">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleDevAuth} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder="dev@prodo.live"
                className="bg-surface-container-high border border-outline-variant px-3 py-2 font-technical-prefix text-xs text-primary outline-none focus:border-amber"
              />
              <input
                type="password"
                required
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter Developer Passphrase"
                className="bg-surface-container-high border border-outline-variant px-3 py-2 font-technical-prefix text-xs text-primary outline-none focus:border-amber"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber hover:bg-amber-400 text-background font-technical-prefix text-xs font-bold uppercase transition-colors"
              >
                {isSubmitting ? "Authenticating..." : "Authorize Developer Token"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col p-6 gap-6 overflow-hidden">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
            <div className="bg-surface-container-lowest border border-outline-variant p-4">
              <div className="font-technical-prefix text-[9px] text-outline-variant uppercase">TOTAL REGISTERED USERS</div>
              <div className="font-value-lg text-[24px] text-primary mt-1">{stats?.total_users ?? "--"}</div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4">
              <div className="font-technical-prefix text-[9px] text-outline-variant uppercase">TELEMETRY LOGS RECORDED</div>
              <div className="font-value-lg text-[24px] text-amber mt-1">{stats?.total_telemetry_logs ?? "--"}</div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4">
              <div className="font-technical-prefix text-[9px] text-outline-variant uppercase">ACTIVE CO-OP ROOMS</div>
              <div className="font-value-lg text-[24px] text-emerald mt-1">{stats?.active_coop_rooms ?? "--"}</div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4">
              <div className="font-technical-prefix text-[9px] text-outline-variant uppercase">DEV ENVIRONMENT</div>
              <div className="font-log-body text-xs font-bold text-primary mt-2">dev.prodo.live (Cloudflare Worker)</div>
            </div>
          </div>

          {/* Telemetry Inspection Feed */}
          <div className="flex-grow bg-surface-container-lowest border border-outline-variant flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-high flex justify-between items-center flex-shrink-0">
              <span className="font-technical-prefix text-xs text-primary font-bold uppercase">
                SYSTEM TELEMETRY INSPECTION FEED
              </span>
              <button
                onClick={fetchDevData}
                disabled={loadingFeed}
                className="font-technical-prefix text-[10px] text-amber hover:underline uppercase"
              >
                {loadingFeed ? "Refreshing..." : "Refresh Feed"}
              </button>
            </div>

            <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] flex flex-col gap-2">
              {logs.length === 0 ? (
                <div className="text-outline-variant italic">No telemetry events logged yet.</div>
              ) : (
                logs.map((item) => (
                  <div key={item.id} className="border-b border-surface-variant pb-2 flex flex-col gap-1 text-on-surface">
                    <div className="flex justify-between text-outline-variant text-[10px]">
                      <span>[{new Date(item.created_at * 1000).toLocaleTimeString()}] EVENT: {item.event}</span>
                      <span>SESSION: {item.session_id}</span>
                    </div>
                    <div className="text-amber">&gt; Details: {JSON.stringify(item.details)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default DevPage;
