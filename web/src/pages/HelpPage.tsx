import React from "react";

const HelpPage: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col p-6 h-full overflow-y-auto select-none">
      {/* Page Header */}
      <div className="mb-6 flex-shrink-0">
        <div className="font-technical-prefix text-technical-prefix text-outline-variant">PRODO_SYSTEM_MANUAL</div>
        <h1 className="font-value-lg text-[32px] text-primary">HUD GLOSSARY & HELP</h1>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant p-6 flex flex-col gap-6 max-w-3xl font-log-body text-sm text-on-surface-variant">
        
        {/* Section 1: Core Mechanics */}
        <div className="border-b border-surface-variant pb-6">
          <h3 className="font-log-body font-bold text-sm text-primary uppercase mb-3">&gt; [CORE_MECHANICS]</h3>
          <div className="flex flex-col gap-4">
            <p>
              Prodo enforces focus habits by gamifying attention cycles. Using computer vision models offloaded to HuggingFace, it tracks gaze and head-pose variables dynamically.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="border border-surface-variant p-4 bg-background">
                <div className="font-technical-prefix text-amber font-bold mb-1">XP_VAL (Focus points)</div>
                <p className="text-xs text-outline-variant">
                  Points accumulated during uninterrupted focus intervals. Used in the Vault shop to unlock temporary allowances for distracting apps.
                </p>
              </div>
              <div className="border border-surface-variant p-4 bg-background">
                <div className="font-technical-prefix text-amber font-bold mb-1">MULTIPLIER_CORE</div>
                <p className="text-xs text-outline-variant">
                  A scaling point multiplier. Increases by 0.05x every second. Caps out at 4.5x. Resetting back to 1.0x occurs when focus breaks.
                </p>
              </div>
              <div className="border border-surface-variant p-4 bg-background">
                <div className="font-technical-prefix text-amber font-bold mb-1">THREAT METER</div>
                <p className="text-xs text-outline-variant">
                  A 15-second grace period buffer that activates the moment gaze contact is broken. Returns to nominal state if gaze is re-established.
                </p>
              </div>
              <div className="border border-surface-variant p-4 bg-background">
                <div className="font-technical-prefix text-amber font-bold mb-1">MINI_VAULT / VAULT</div>
                <p className="text-xs text-outline-variant">
                  Allowlisting bypass index. Costs focus points (XP) to temporarily white-list restricted software processes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Shell commands */}
        <div className="border-b border-surface-variant pb-6">
          <h3 className="font-log-body font-bold text-sm text-primary uppercase mb-3">&gt; [SHELL_DIAGNOSTIC_COMMANDS]</h3>
          <p className="mb-2">
            The command shell at the bottom-right of the Focus HUD allows direct override manipulation:
          </p>
          <div className="bg-background border border-outline-variant p-4 flex flex-col gap-2 font-technical-prefix text-xs text-outline-variant">
            <div><span className="text-amber">help</span> - List available override prompts.</div>
            <div><span className="text-amber">start</span> - Activate neural focus tracking links.</div>
            <div><span className="text-amber">stop</span> - Disengage focus engines.</div>
            <div><span className="text-amber">unlock [APP_NAME]</span> - Buy temporary bypass authorization (e.g. <span className="text-primary">unlock reddit</span>).</div>
            <div><span className="text-amber">addxp [VALUE]</span> - Force add specified focus XP points (cheat mode).</div>
            <div><span className="text-amber">clear</span> - Wipe active shell prompt logs.</div>
          </div>
        </div>

        {/* Section 3: Trouble shooting */}
        <div>
          <h3 className="font-log-body font-bold text-sm text-primary uppercase mb-3">&gt; [TROUBLESHOOTING_TELEMETRY]</h3>
          <ul className="list-disc pl-5 flex flex-col gap-2 text-xs">
            <li>
              <strong>Webcam fails to start:</strong> Ensure no other application (like Zoom or Teams) is locking camera hardware access. Verify permissions are enabled in OS settings.
            </li>
            <li>
              <strong>Bypass fails to launch application:</strong> Check that target paths inside the configuration matches your local process executable name (e.g., <code className="text-primary bg-background px-1">Discord.exe</code> or <code className="text-primary bg-background px-1">Steam.exe</code>).
            </li>
            <li>
              <strong>Connection linkages return 0%:</strong> Ensure network connection to HuggingFace spaces or Cloudflare API server is stable. Try disabling/re-enabling tracking to reboot connection interfaces.
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default HelpPage;
