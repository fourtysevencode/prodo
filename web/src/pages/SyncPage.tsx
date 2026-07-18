import React, { useState } from "react";

const SyncPage: React.FC = () => {
  const [reveal, setReveal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const token = localStorage.getItem("prodo_token") || "";

  const handleCopy = () => {
    if (!token) return;
    try {
      navigator.clipboard.writeText(token);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (e) {
      window.prompt("Copy your key:", token);
    }
  };

  return (
    <div className="flex-grow flex flex-col p-6 h-full overflow-hidden select-none relative">
      
      {/* Page Header */}
      <div className="mb-6 flex-shrink-0">
        <div className="font-technical-prefix text-technical-prefix text-outline-variant">SYSTEM_DEVICE_LINK</div>
        <h1 className="font-value-lg text-[32px] text-primary">DESKTOP SYNC</h1>
      </div>

      {/* Sync Card */}
      <div className="flex-grow flex flex-col items-center justify-center p-6 bg-surface-container-lowest border border-outline-variant max-w-2xl mx-auto w-full gap-6">
        
        <span className="material-symbols-outlined text-[48px] text-primary">vpn_key</span>
        
        <div className="text-center">
          <h3 className="font-value-lg text-lg text-primary uppercase">Secure Authentication Key</h3>
          <p className="font-technical-prefix text-[9px] text-outline-variant uppercase mt-1">
            This key authorizes local client blockers to authenticate with your remote account.
          </p>
        </div>

        {token ? (
          <div className="w-full flex flex-col gap-4">
            
            {/* Key display container */}
            <div className="flex border border-outline-variant bg-[#0A0A0A] items-center px-4 py-3 min-h-[48px]">
              <span className="font-technical-prefix text-xs text-primary flex-grow break-all tracking-wider">
                {reveal ? token : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
              </span>
              <button
                onClick={() => setReveal(!reveal)}
                className="text-outline-variant hover:text-white transition-colors ml-3 material-symbols-outlined text-[20px]"
                title={reveal ? "Hide Key" : "Reveal Key"}
              >
                {reveal ? "visibility_off" : "visibility"}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleCopy}
                className="flex-grow py-3 bg-primary text-background font-technical-prefix text-xs font-bold uppercase hover:bg-white transition-colors"
              >
                {copyFeedback ? "✓ COPIED" : "COPY SYNC KEY"}
              </button>
            </div>

          </div>
        ) : (
          <div className="w-full bg-[#1C0000] border border-crimson p-4 text-center">
            <span className="font-technical-prefix text-xs text-crimson uppercase">
              ❌ No active session found. Please sign in to generate a sync key.
            </span>
          </div>
        )}

        {/* Info list */}
        <div className="border-t border-outline-variant/30 pt-6 mt-2 w-full flex flex-col gap-3 font-technical-prefix text-[9px] text-outline-variant uppercase select-text">
          <div className="flex gap-2">
            <span className="text-primary">01/</span>
            <span>Launch the Prodo Desktop Client application on your computer.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">02/</span>
            <span>Copy this generated token key (do not share it with anyone).</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">03/</span>
            <span>Paste the token key inside the desktop client paste field and hit sync.</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SyncPage;
