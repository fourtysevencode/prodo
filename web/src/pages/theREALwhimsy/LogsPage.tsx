import React, { useState } from "react";
import { useFocus } from "../../context/FocusContext";

/**
 * WhimsicalLogsPage - Clean, cheerful log viewer for beta.prodo.live.
 * Presents system telemetry and session logs in rounded cards with clear index badges,
 * filter pills, and bright status indicators.
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
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div>
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            SESSION TELEMETRY & AUDIT
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            System Logs
          </h1>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full border border-slate-200">
          {["ALL", "SYSTEM", "ERRORS"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-5 py-2 rounded-full text-xs font-extrabold tracking-wider transition-all uppercase ${
                filter === type
                  ? "bg-[#0047AB] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              REAL-TIME LOG STREAM
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Total Entries: {filteredLogs.length}
          </span>
        </div>

        {/* Log Entries Cards */}
        <div className="flex flex-col gap-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-medium italic">
              No logs found matching filter guidelines.
            </div>
          ) : (
            filteredLogs.map((log, idx) => {
              const isError = log.type === "ERROR";
              const isSuccess = log.type === "SUCCESS";

              return (
                <div
                  key={idx}
                  className={`bg-slate-50/80 border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-white hover:shadow-xs ${
                    isError
                      ? "border-rose-200 bg-rose-50/40 text-rose-900"
                      : isSuccess
                      ? "border-emerald-200 bg-emerald-50/40 text-emerald-900"
                      : "border-slate-200/80 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Circle Index Badge */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${
                        isError
                          ? "bg-rose-500 text-white"
                          : isSuccess
                          ? "bg-emerald-500 text-white"
                          : "bg-[#0047AB] text-white"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                          {log.code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          [{log.timestamp}]
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 mt-0.5">
                        {log.message}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border self-start sm:self-center ${
                      isError
                        ? "bg-rose-100 text-rose-700 border-rose-200"
                        : isSuccess
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-blue-100 text-[#0047AB] border-blue-200"
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
