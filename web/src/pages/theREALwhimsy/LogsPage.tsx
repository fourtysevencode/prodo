import React, { useState } from "react";
import { useFocus } from "../../context/FocusContext";

/**
 * WhimsicalLogsPage - Clean, immersive log viewer for beta.prodo.live.
 * Presents system telemetry and session logs in rounded cards with clear index badges,
 * filter pills, and bright status indicators to match the dark aesthetic.
 */
const WhimsicalLogsPage: React.FC = () => {
  const { systemLogs } = useFocus();
  const [filter, setFilter] = useState<string>("ALL");

  const filteredLogs = systemLogs.filter((log) => {
    if (filter === "ALL") return true;
    if (filter === "ERRORS") return log.type === "ERROR";
    if (filter === "SYSTEM") return log.type === "SYSTEM" || log.type === "SUCCESS";
    return true;
  });

  return (
    <div className="flex flex-col gap-6 pb-12 mt-8">
      
      {/* Header & Filter Controls */}
      <div className="bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-on-surface/50 uppercase tracking-widest">
            SESSION TELEMETRY & AUDIT
          </span>
          <h1 className="text-3xl font-display font-black text-on-surface tracking-tight mt-1">
            System Logs
          </h1>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-background p-1.5 rounded-full border border-lavender/50">
          {["ALL", "SYSTEM", "ERRORS"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-5 py-2 rounded-full text-xs font-bold tracking-wider transition-all uppercase ${
                filter === type
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-on-surface/60 hover:text-on-surface hover:bg-surface/60"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List Container */}
      <div className="bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex flex-col gap-4">
        
        <div className="flex items-center justify-between pb-4 border-b border-lavender/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-[10px] font-bold text-on-surface/70 uppercase tracking-wider">
              REAL-TIME LOG STREAM
            </span>
          </div>
          <span className="text-[10px] font-bold text-on-surface/50 uppercase">
            Total Entries: {filteredLogs.length}
          </span>
        </div>

        {/* Log Entries Cards */}
        <div className="flex flex-col gap-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-on-surface/40 text-sm font-medium italic">
              No logs found matching filter guidelines.
            </div>
          ) : (
            filteredLogs.map((log, idx) => {
              const isError = log.type === "ERROR";
              const isSuccess = log.type === "SUCCESS";

              return (
                <div
                  key={idx}
                  className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-surface hover:scale-[1.01] ${
                    isError
                      ? "border-heart-red/40 bg-heart-red/10 text-heart-red"
                      : isSuccess
                      ? "border-secondary/40 bg-secondary/10 text-secondary"
                      : "border-lavender bg-background/50 text-on-surface"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Circle Index Badge */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                        isError
                          ? "bg-heart-red text-white"
                          : isSuccess
                          ? "bg-secondary text-background"
                          : "bg-primary text-white"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider">
                          {log.code}
                        </span>
                        <span className="text-[10px] font-bold opacity-50">
                          [{log.timestamp}]
                        </span>
                      </div>
                      <p className="text-xs font-semibold opacity-80 mt-0.5">
                        {log.message}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border self-start sm:self-center ${
                      isError
                        ? "bg-heart-red/20 border-heart-red/30 text-heart-red"
                        : isSuccess
                        ? "bg-secondary/20 border-secondary/30 text-secondary"
                        : "bg-primary/20 border-primary/30 text-primary"
                    }`}
                  >
                    {log.type}
                  </span>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};

export default WhimsicalLogsPage;
