import React, { useState } from "react";
import { useFocus } from "../context/FocusContext";

const LogsPage: React.FC = () => {
  const { systemLogs } = useFocus();
  const [filter, setFilter] = useState<string>("ALL");

  const filteredLogs = systemLogs.filter(log => {
    if (filter === "ALL") return true;
    if (filter === "ERRORS") return log.type === "ERROR";
    if (filter === "SYSTEM") return log.type === "SYSTEM" || log.type === "SUCCESS";
    return true;
  });

  return (
    <div className="flex-grow flex flex-col p-6 h-full overflow-hidden select-none">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <div className="font-technical-prefix text-technical-prefix text-outline-variant">PRODO_HUD_TELEMETRY</div>
          <h1 className="font-value-lg text-[32px] text-primary">SYSTEM LOGS</h1>
        </div>

        {/* Filters */}
        <div className="flex border border-outline-variant">
          {["ALL", "SYSTEM", "ERRORS"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 font-technical-prefix text-[10px] uppercase border-r last:border-r-0 border-outline-variant transition-colors hover:bg-surface-container-high ${
                filter === type ? "bg-primary text-background font-bold" : "text-on-surface-variant"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Feed Layout */}
      <div className="flex-grow bg-surface-container-lowest border border-outline-variant p-6 flex flex-col font-log-body text-xs text-outline-variant overflow-hidden">
        {/* Terminal Header */}
        <div className="border-b border-surface-variant pb-3 mb-4 flex justify-between items-center text-[10px] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald unlocked-pulse"></span>
            <span className="font-technical-prefix text-[8px] uppercase text-emerald">SYNC_ONLINE</span>
          </div>
          <div>ESTABLISHED CONNECTION FEED &gt;&gt; HOST: LOCAL_DB</div>
        </div>

        {/* Scrollable logs list */}
        <div className="flex-grow overflow-y-auto flex flex-col gap-3 pr-2">
          {filteredLogs.length === 0 ? (
            <div className="opacity-40 italic">No logs found matching filter guidelines.</div>
          ) : (
            filteredLogs.map((log, idx) => {
              const isError = log.type === "ERROR";
              const isSuccess = log.type === "SUCCESS";
              
              return (
                <div 
                  key={idx} 
                  className={`flex flex-col md:flex-row md:items-start gap-1 md:gap-4 p-3 border-l-2 bg-[#0E0E0E] transition-all hover:bg-surface-container-low ${
                    isError 
                      ? "border-crimson text-crimson" 
                      : isSuccess 
                        ? "border-emerald text-emerald" 
                        : "border-outline-variant text-on-surface-variant"
                  }`}
                >
                  <span className="font-technical-prefix text-[9px] opacity-70 flex-shrink-0">
                    [{log.timestamp}]
                  </span>
                  <span className="font-technical-prefix text-[10px] font-bold tracking-wider flex-shrink-0 min-w-[90px]">
                    {log.code}
                  </span>
                  <span className="flex-grow">
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
          <div className="opacity-35 mt-2 blink-cursor">_awaiting system signals</div>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
