import React from "react";

const WhimsicalHelpPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 pb-12 mt-8">
      
      {/* Header */}
      <div className="bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-on-surface/50 uppercase tracking-widest">
            PRODO_SYSTEM_MANUAL
          </span>
          <h1 className="text-3xl font-display font-black text-on-surface tracking-tight mt-1">
            HUD Glossary & Help
          </h1>
        </div>
      </div>

      <div className="bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 md:p-8 kawaii-shadow flex flex-col gap-8 max-w-3xl">
        
        {/* Section 1: Core Mechanics */}
        <div className="border-b border-lavender/30 pb-6">
          <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wider mb-4">&gt; [CORE_MECHANICS]</h3>
          <div className="flex flex-col gap-4 text-xs font-semibold text-on-surface/70 leading-relaxed">
            <p>
              Prodo enforces focus habits by gamifying attention cycles. Using computer vision models offloaded to HuggingFace, it tracks gaze and head-pose variables dynamically.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="border border-lavender/50 rounded-2xl p-4 bg-background/50">
                <div className="text-[10px] text-primary font-black uppercase tracking-wider mb-2">XP_VAL (Focus points)</div>
                <p className="text-[10px] text-on-surface/50 font-bold leading-normal">
                  Points accumulated during uninterrupted focus intervals. Used in the Vault shop to unlock temporary allowances for distracting apps.
                </p>
              </div>
              <div className="border border-lavender/50 rounded-2xl p-4 bg-background/50">
                <div className="text-[10px] text-primary font-black uppercase tracking-wider mb-2">MULTIPLIER_CORE</div>
                <p className="text-[10px] text-on-surface/50 font-bold leading-normal">
                  A scaling point multiplier. Increases by 0.05x every second. Caps out at 4.5x. Resetting back to 1.0x occurs when focus breaks.
                </p>
              </div>
              <div className="border border-lavender/50 rounded-2xl p-4 bg-background/50">
                <div className="text-[10px] text-primary font-black uppercase tracking-wider mb-2">THREAT METER</div>
                <p className="text-[10px] text-on-surface/50 font-bold leading-normal">
                  A 15-second grace period buffer that activates the moment gaze contact is broken. Returns to nominal state if gaze is re-established.
                </p>
              </div>
              <div className="border border-lavender/50 rounded-2xl p-4 bg-background/50">
                <div className="text-[10px] text-primary font-black uppercase tracking-wider mb-2">MINI_VAULT / VAULT</div>
                <p className="text-[10px] text-on-surface/50 font-bold leading-normal">
                  Allowlisting bypass index. Costs focus points (XP) to temporarily white-list restricted software processes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Shell commands */}
        <div className="border-b border-lavender/30 pb-6">
          <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wider mb-4">&gt; [SHELL_DIAGNOSTIC_COMMANDS]</h3>
          <p className="mb-4 text-xs font-semibold text-on-surface/70 leading-relaxed">
            The command shell at the bottom-right of the Focus HUD allows direct override manipulation:
          </p>
          <div className="bg-background/80 border border-lavender/50 rounded-2xl p-5 flex flex-col gap-3 text-[10px] font-black text-on-surface/50 uppercase tracking-wider">
            <div><span className="text-secondary">help</span> - List available override prompts.</div>
            <div><span className="text-secondary">start</span> - Activate neural focus tracking links.</div>
            <div><span className="text-secondary">stop</span> - Disengage focus engines.</div>
            <div><span className="text-secondary">unlock [APP_NAME]</span> - Buy temporary bypass authorization (e.g. <span className="text-primary">unlock reddit</span>).</div>
            <div><span className="text-secondary">addxp [VALUE]</span> - Force add specified focus XP points (cheat mode).</div>
            <div><span className="text-secondary">clear</span> - Wipe active shell prompt logs.</div>
          </div>
        </div>

        {/* Section 3: Trouble shooting */}
        <div>
          <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wider mb-4">&gt; [TROUBLESHOOTING_TELEMETRY]</h3>
          <ul className="list-disc pl-5 flex flex-col gap-3 text-xs font-semibold text-on-surface/70 leading-relaxed">
            <li>
              <strong className="text-on-surface font-extrabold">Webcam fails to start:</strong> Ensure no other application (like Zoom or Teams) is locking camera hardware access. Verify permissions are enabled in OS settings.
            </li>
            <li>
              <strong className="text-on-surface font-extrabold">Bypass fails to launch application:</strong> Check that target paths inside the configuration matches your local process executable name (e.g., <code className="text-primary bg-primary/10 px-1 rounded">Discord.exe</code> or <code className="text-primary bg-primary/10 px-1 rounded">Steam.exe</code>).
            </li>
            <li>
              <strong className="text-on-surface font-extrabold">Connection linkages return 0%:</strong> Ensure network connection to HuggingFace spaces or Cloudflare API server is stable. Try disabling/re-enabling tracking to reboot connection interfaces.
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default WhimsicalHelpPage;
