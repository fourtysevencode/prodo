import React, { useState } from "react";

const LandingPage: React.FC = () => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  return (
    <div className="w-screen min-h-screen bg-[#0A0A0A] text-on-surface font-log-body overflow-x-hidden selection:bg-primary selection:text-background relative">
      
      {/* Background Grid & Ambient Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber/5 blur-[150px] pointer-events-none"></div>

      {/* Header NavBar */}
      <header className="relative w-full max-w-7xl mx-auto px-6 h-20 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Prodo Logo" className="w-8 h-8" />
          <span className="font-value-lg text-2xl text-primary tracking-widest uppercase drop-shadow-[0_0_8px_rgba(229,226,225,0.2)]">
            PRODO
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a 
            href="https://prodo.live/#/focus"
            className="px-5 py-2 border border-outline-variant hover:border-primary text-xs font-technical-prefix font-bold uppercase transition-all duration-300"
          >
            Launch Dashboard
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative max-w-5xl mx-auto px-6 pt-20 pb-32 text-center z-10 flex flex-col items-center gap-8">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary/20 bg-primary/5 text-primary rounded-full text-[10px] font-technical-prefix uppercase tracking-wider mb-4 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          System Version 2.0.4 Online
        </div>

        <h1 className="font-value-xl text-5xl md:text-7xl leading-tight uppercase tracking-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-[#E5E2E1] to-[#737170]">
          Turn your willpower into an economic incentive
        </h1>

        <p className="font-technical-prefix text-sm md:text-base text-outline-variant max-w-2xl leading-relaxed mt-2 uppercase tracking-wide">
          Prodo is a gamified focus engine. Earn points for deep work, spend points to buy break time, and face immediate penalties for distraction.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md justify-center">
          <a 
            href="https://prodo.live/#/login"
            className="flex-1 py-4 bg-primary text-background font-technical-prefix font-bold uppercase text-xs hover:bg-white transition-all duration-300 shadow-lg shadow-primary/20 text-center"
          >
            Sign Up & Launch
          </a>
          <button 
            onClick={() => setShowDownloadModal(true)}
            className="flex-grow py-4 border border-outline-variant hover:border-amber hover:text-amber transition-all duration-300 font-technical-prefix font-bold uppercase text-xs bg-[#0E0E0E]/50"
          >
            Download Clients
          </button>
        </div>

        {/* Client stats banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full border-y border-outline-variant/30 py-10 mt-24">
          <div className="flex flex-col items-center">
            <span className="font-value-lg text-3xl text-primary">2.5X</span>
            <span className="font-technical-prefix text-[9px] text-outline-variant uppercase mt-1">Co-op Focus Boost</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-value-lg text-3xl text-primary">15s</span>
            <span className="font-technical-prefix text-[9px] text-outline-variant uppercase mt-1">Smart Grace Buffer</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-value-lg text-3xl text-primary">100%</span>
            <span className="font-technical-prefix text-[9px] text-outline-variant uppercase mt-1">Privacy-first Local CV</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-value-lg text-3xl text-primary">0s</span>
            <span className="font-technical-prefix text-[9px] text-outline-variant uppercase mt-1">Zero Rigid App Blocks</span>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full text-left">
          <div className="border border-outline-variant/30 p-6 bg-[#0E0E0E]/40 flex flex-col gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">radar</span>
            <h3 className="font-technical-prefix text-xs font-bold text-primary uppercase">Neural Gaze Tracking</h3>
            <p className="font-technical-prefix text-[11px] text-outline-variant leading-relaxed uppercase">
              Webcam-based landmark mesh model captures gaze direction & eye state. Buffers looking away for stretches while flagging distractions.
            </p>
          </div>

          <div className="border border-outline-variant/30 p-6 bg-[#0E0E0E]/40 flex flex-col gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">sports_esports</span>
            <h3 className="font-technical-prefix text-xs font-bold text-primary uppercase">The Focus Economy</h3>
            <p className="font-technical-prefix text-[11px] text-outline-variant leading-relaxed uppercase">
              Accumulate points continuously. Spend them inside the distraction vault to buy break time to browse entertainment apps or gaming hubs.
            </p>
          </div>

          <div className="border border-outline-variant/30 p-6 bg-[#0E0E0E]/40 flex flex-col gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">shield_alert</span>
            <h3 className="font-technical-prefix text-xs font-bold text-primary uppercase">Instant Penalties</h3>
            <p className="font-technical-prefix text-[11px] text-outline-variant leading-relaxed uppercase">
              Distracted behavior triggers negative point modifier pings, leading to core-temp overrides and severe interface punishments.
            </p>
          </div>
        </div>

      </main>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 z-[1000] select-none">
          <div className="w-full max-w-md border-2 border-outline-variant bg-[#0A0A0A] p-8 flex flex-col gap-6 shadow-2xl shadow-black">
            
            <div className="flex justify-between items-start">
              <div>
                <div className="font-technical-prefix text-technical-prefix text-primary uppercase mb-1">
                  SYSTEM_CLIENT_ACCESS
                </div>
                <h3 className="font-value-lg text-lg text-primary uppercase">
                  Download Prodo Enforcers
                </h3>
              </div>
              <button 
                onClick={() => setShowDownloadModal(false)}
                className="text-outline-variant hover:text-white transition-colors material-symbols-outlined"
              >
                close
              </button>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Desktop link */}
              <div className="border border-outline-variant p-4 bg-[#0E0E0E] flex justify-between items-center">
                <div>
                  <h4 className="font-technical-prefix text-xs font-bold text-primary">Desktop App ( T-1 )</h4>
                  <p className="font-technical-prefix text-[8px] text-outline-variant uppercase mt-1">Windows x64 / macOS Apple Silicon</p>
                </div>
                <button 
                  onClick={() => alert("✓ Desktop build release bundle compiling. Available for download soon!")}
                  className="px-3 py-1.5 bg-primary text-background font-technical-prefix text-[9px] font-bold uppercase hover:bg-white transition-colors"
                >
                  Download
                </button>
              </div>

              {/* Mobile link */}
              <div className="border border-outline-variant p-4 bg-[#0E0E0E] flex justify-between items-center">
                <div>
                  <h4 className="font-technical-prefix text-xs font-bold text-primary">Android Client</h4>
                  <p className="font-technical-prefix text-[8px] text-outline-variant uppercase mt-1">Install Companion APK v2.0</p>
                </div>
                <a 
                  href="/app-debug.apk"
                  download="app-debug.apk"
                  className="px-3 py-1.5 bg-amber text-background font-technical-prefix text-[9px] font-bold uppercase hover:bg-amber-400 transition-colors text-center inline-block"
                >
                  Download APK
                </a>
              </div>

            </div>

            <div className="border-t border-outline-variant/30 pt-4 text-center font-technical-prefix text-[8px] text-outline-variant uppercase">
              Direct secure downloads. Secure signature verified.
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-outline-variant/30 py-8 text-center font-technical-prefix text-[9px] text-outline-variant uppercase tracking-wider">
        © {new Date().getFullYear()} PRODO FOCUS CORE. SECURE GATEWAY NET PROTOCOL.
      </footer>

    </div>
  );
};

export default LandingPage;
