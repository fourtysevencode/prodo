import React from "react";

/**
 * ForbiddenPage - 403 Forbidden Error View.
 * Displayed when accessing restricted domains like beta.prodo.live
 * or non-developer accounts attempting to access dev.prodo.live.
 */
const ForbiddenPage: React.FC<{ message?: string }> = ({
  message = "Access to this domain or resource is strictly forbidden."
}) => {
  return (
    <div className="w-screen h-screen bg-[#0B0E23] text-[#E0E0FF] flex items-center justify-center p-6 select-none font-sans relative overflow-hidden">

      {/* Background Floating Decorative Lights */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#9D72FF] rounded-full blur-3xl float-anim"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#FF4D6D] rounded-full blur-3xl float-anim-delayed"></div>
      </div>

      <div className="w-full max-w-lg bg-[#1A1C3D] border border-[#2D3261] rounded-[32px] p-8 md:p-10 shadow-2xl flex flex-col items-center text-center relative z-10 kawaii-shadow">

        {/* Error Icon Bubble */}
        <div className="w-20 h-20 rounded-3xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/30 text-[#FF4D6D] flex items-center justify-center mb-6 float-anim">
          <span className="material-symbols-outlined text-5xl">lock_person</span>
        </div>

        {/* Status Pill */}
        <span className="bg-[#FF4D6D]/20 text-[#FF4D6D] text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-[#FF4D6D]/30 mb-4">
          403 FORBIDDEN
        </span>

        <h1 className="text-3xl font-black text-white tracking-tight mb-3">
          Restricted Zone
        </h1>

        <p className="text-sm font-semibold text-slate-300 mb-8 max-w-md leading-relaxed">
          {message}
        </p>

        {/* Action Button */}
        <a
          href="https://www.prodo.live"
          className="w-full py-3.5 px-6 bg-[#9D72FF] hover:bg-[#8B5CF6] text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-[#9D72FF]/30 transition-all btn-bubbly flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">home</span>
          Return to www.prodo.live
        </a>

        {/* System Log Footer */}
        <div className="mt-8 pt-4 border-t border-[#2D3261]/50 w-full text-[11px] font-mono text-slate-400 text-center">
          ERR_CODE: HTTP_403_ACCESS_DENIED • HOST: {typeof window !== "undefined" ? window.location.hostname : "beta.prodo.live"}
        </div>

      </div>
    </div>
  );
};

export default ForbiddenPage;
