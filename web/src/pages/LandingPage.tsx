import React, { useState } from "react";

/**
 * LandingPage - WHIMSY UPDATE
 */
const LandingPage: React.FC = () => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  return (
    <div className="w-screen min-h-screen bg-[#0B0E23] text-[#E0E0FF] font-sans overflow-x-hidden select-none relative flex flex-col">

      {/* Background Ambient Glows & Floating Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[#9D72FF] blur-[140px] float-anim"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#00F5FF] blur-[160px] float-anim-delayed"></div>
        <div className="absolute top-[40%] right-[25%] w-[400px] h-[400px] rounded-full bg-[#7B68EE] blur-[120px] float-anim"></div>
      </div>

      {/* Header NavBar */}
      <header className="relative w-full max-w-7xl mx-auto px-6 h-24 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9D72FF] to-[#00F5FF] text-white flex items-center justify-center font-black text-2xl shadow-lg kawaii-shadow">
            P
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-2xl text-white tracking-tight">
              prodo
            </span>
            <span className="bg-[#9D72FF]/20 text-[#9D72FF] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-[#9D72FF]/30">
              BETA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://prodo.live/#/login"
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs uppercase tracking-wider rounded-full border border-white/20 transition-all btn-bubbly"
          >
            Log In
          </a>
          <a
            href="https://prodo.live/#/login"
            className="px-6 py-2.5 bg-gradient-to-r from-[#9D72FF] to-[#00F5FF] text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg shadow-[#9D72FF]/30 transition-all btn-bubbly"
          >
            Launch Dashboard
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative max-w-5xl mx-auto px-6 pt-12 pb-24 text-center z-10 flex flex-col items-center gap-8">

        {/* Version Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1C3D] border border-[#2D3261] text-[#00F5FF] text-xs font-bold uppercase tracking-wider shadow-md">
          <span className="w-2 h-2 rounded-full bg-[#00F5FF] animate-pulse"></span>
          System Version 2.0.4 Online
        </div>

        {/* Hero Title */}
        <h1 className="font-display font-black text-5xl md:text-7xl leading-tight text-white tracking-tight max-w-4xl drop-shadow-[0_0_35px_rgba(157,114,255,0.4)]">
          Turn your willpower into an economic incentive
        </h1>

        {/* Hero Subtitle */}
        <p className="font-sans font-semibold text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
          Prodo is a joyful gamified focus engine. Earn points for deep focus sessions, unlock break time, and stay accountable with instant AI feedback.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full max-w-md justify-center">
          <a
            href="https://prodo.live/#/login"
            className="flex-1 py-4 px-8 bg-gradient-to-r from-[#9D72FF] to-[#00F5FF] text-white font-extrabold text-sm uppercase tracking-wider rounded-full shadow-xl shadow-[#9D72FF]/40 transition-all btn-bubbly text-center"
          >
            Sign Up & Launch
          </a>
          <button
            onClick={() => setShowDownloadModal(true)}
            className="flex-1 py-4 px-8 bg-[#1A1C3D] hover:bg-[#2E1A47] text-white font-extrabold text-sm uppercase tracking-wider rounded-full border border-[#2D3261] transition-all btn-bubbly"
          >
            Download Clients
          </button>
        </div>

        {/* Client Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full bg-[#1A1C3D]/80 backdrop-blur-xl border border-[#2D3261] rounded-[32px] p-8 mt-16 kawaii-shadow">
          <div className="flex flex-col items-center">
            <span className="font-display font-black text-4xl text-[#00F5FF]">2.5X</span>
            <span className="font-bold text-xs text-slate-300 uppercase tracking-wider mt-1">Co-op Focus Boost</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display font-black text-4xl text-[#9D72FF]">15s</span>
            <span className="font-bold text-xs text-slate-300 uppercase tracking-wider mt-1">Smart Grace Buffer</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display font-black text-4xl text-[#00F5FF]">100%</span>
            <span className="font-bold text-xs text-slate-300 uppercase tracking-wider mt-1">Privacy-first Local CV</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display font-black text-4xl text-[#FF4D6D]">0s</span>
            <span className="font-bold text-xs text-slate-300 uppercase tracking-wider mt-1">Zero Rigid App Blocks</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 w-full text-left">
          <div className="bg-[#1A1C3D]/90 backdrop-blur-xl border border-[#2D3261] rounded-[32px] p-8 kawaii-shadow flex flex-col gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#9D72FF]/20 border border-[#9D72FF]/40 text-[#9D72FF] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">radar</span>
            </div>
            <h3 className="font-display font-black text-lg text-white">Neural Gaze Tracking</h3>
            <p className="font-sans font-semibold text-xs text-slate-300 leading-relaxed">
              Webcam-based landmark mesh model captures gaze direction & eye state. Buffers looking away while flagging prolonged distraction.
            </p>
          </div>

          <div className="bg-[#1A1C3D]/90 backdrop-blur-xl border border-[#2D3261] rounded-[32px] p-8 kawaii-shadow flex flex-col gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#00F5FF]/20 border border-[#00F5FF]/40 text-[#00F5FF] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">auto_awesome</span>
            </div>
            <h3 className="font-display font-black text-lg text-white">AI Feedback</h3>
            <p className="font-sans font-semibold text-xs text-slate-300 leading-relaxed">
              AI-generated typing pledges, multiple choice check-ins, and friendly challenges when focus slips.
            </p>
          </div>

          <div className="bg-[#1A1C3D]/90 backdrop-blur-xl border border-[#2D3261] rounded-[32px] p-8 kawaii-shadow flex flex-col gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FF4D6D]/20 border border-[#FF4D6D]/40 text-[#FF4D6D] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">group</span>
            </div>
            <h3 className="font-display font-black text-lg text-white">Co-op Focus Rooms</h3>
            <p className="font-sans font-semibold text-xs text-slate-300 leading-relaxed">
              Study together with friends. Earn multiplier bonuses when your group stays locked in deep work together.
            </p>
          </div>
        </div>

      </main>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1C3D] border border-[#2D3261] rounded-[32px] p-8 max-w-md w-full kawaii-shadow text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#9D72FF]/20 text-[#9D72FF] flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">download</span>
            </div>
            <h3 className="font-display font-black text-2xl text-white">Download Prodo Clients</h3>
            <p className="text-xs font-semibold text-slate-300">
              Get the native desktop app (macOS / Windows / Linux) or Android client for full focus hardware integration.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <a
                href="/app-debug.apk"
                download
                className="py-3.5 bg-gradient-to-r from-[#9D72FF] to-[#00F5FF] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md btn-bubbly flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">android</span>
                Download Android APK
              </a>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="py-3 bg-white/10 text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-2xl border border-white/20 hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
