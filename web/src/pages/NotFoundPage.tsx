import React from "react";
import { Link } from "react-router-dom";

/**
 * NotFoundPage - 404 Route Not Found View.
 * The WHIMSY update.
 */
const NotFoundPage: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-[#0B0E23] text-[#E0E0FF] flex items-center justify-center p-6 select-none font-sans relative overflow-hidden">

      {/* Background Floating Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-[#9D72FF] rounded-full blur-3xl float-anim"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#00F5FF] rounded-full blur-3xl float-anim-delayed"></div>
      </div>

      <div className="w-full max-w-lg bg-[#1A1C3D] border border-[#2D3261] rounded-[32px] p-8 md:p-10 shadow-2xl flex flex-col items-center text-center relative z-10 kawaii-shadow">

        {/* Error Icon Bubble */}
        <div className="w-20 h-20 rounded-3xl bg-[#9D72FF]/15 border border-[#9D72FF]/30 text-[#9D72FF] flex items-center justify-center mb-6 float-anim">
          <span className="material-symbols-outlined text-5xl">explore_off</span>
        </div>

        {/* Status Pill */}
        <span className="bg-[#9D72FF]/20 text-[#9D72FF] text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-[#9D72FF]/30 mb-4">
          404 NOT FOUND
        </span>

        <h1 className="text-3xl font-black text-white tracking-tight mb-3">
          Page Lost in Space
        </h1>

        <p className="text-sm font-semibold text-slate-300 mb-8 max-w-md leading-relaxed">
          The requested page or route could not be found inside Prodo. It might have moved or doesn't exist anymore.
        </p>

        {/* Action Button */}
        <Link
          to="/focus"
          className="w-full py-3.5 px-6 bg-[#9D72FF] hover:bg-[#8B5CF6] text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-[#9D72FF]/30 transition-all btn-bubbly flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">radar</span>
          Return to Focus Dashboard
        </Link>

        {/* System Log Footer */}
        <div className="mt-8 pt-4 border-t border-[#2D3261]/50 w-full text-[11px] font-mono text-slate-400 text-center">
          ERR_CODE: HTTP_404_NOT_FOUND • PATH: {typeof window !== "undefined" ? window.location.hash || window.location.pathname : "/"}
        </div>

      </div>
    </div>
  );
};

export default NotFoundPage;
