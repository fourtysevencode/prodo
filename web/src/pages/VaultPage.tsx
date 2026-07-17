import React, { useState } from "react";
import { useFocus } from "../context/FocusContext";
import { apiGenerateAITask, apiVerifyAITask } from "../api/prodoApi";
import type { AITaskResponse } from "../api/prodoApi";

const VaultPage: React.FC = () => {
  const { xp, vaultItems, purchaseApp } = useFocus();

  // AI Waiver states
  const [activeWaiverTask, setActiveWaiverTask] = useState<AITaskResponse | null>(null);
  const [waiverAnswer, setWaiverAnswer] = useState("");
  const [waiverMsg, setWaiverMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleRequestWaiver = async (type: "math" | "focus" | "essay") => {
    setWaiverMsg(null);
    setWaiverAnswer("");
    // standardise to "essay" if "focus" is requested
    const resolvedType = type === "focus" || type === "essay" ? "essay" : "math";
    try {
      const res = await apiGenerateAITask(resolvedType);
      if (res.success) {
        setActiveWaiverTask(res);
      }
    } catch (e: any) {
      console.error(e);
      alert("❌ FAIL: Failed to communicate with AI generation node.");
    }
  };

  const handleVerifyWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWaiverTask) return;
    setIsVerifying(true);
    setWaiverMsg(null);
    try {
      const res = await apiVerifyAITask(activeWaiverTask.task_id, waiverAnswer);
      if (res.success) {
        setWaiverMsg(`✓ SUCCESS: ${res.message}`);
        setTimeout(() => {
          setActiveWaiverTask(null);
          // Reload page to re-sync XP balance
          window.location.reload();
        }, 2000);
      } else {
        setWaiverMsg(`❌ ERROR: ${res.message}`);
      }
    } catch (e: any) {
      setWaiverMsg(`❌ ERROR: ${e.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col p-6 h-full overflow-hidden select-none relative">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <div className="font-technical-prefix text-technical-prefix text-outline-variant">PRODO_SECURE_BYPASS</div>
          <h1 className="font-value-lg text-[32px] text-primary">DISTRACTION VAULT</h1>
        </div>

        {/* XP counter */}
        <div className="border border-outline-variant bg-surface-container-lowest px-4 py-2 flex flex-col justify-center text-right">
          <span className="font-technical-prefix text-[8px] text-outline-variant">AVAILABLE_XP</span>
          <span className="font-value-lg text-lg text-amber">{xp.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Grid of Vault Items */}
      <div className="flex-grow bg-surface-container-lowest border border-outline-variant p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaultItems.map((item) => {
            const min = item.timerRemaining ? Math.floor(item.timerRemaining / 60) : 0;
            const sec = item.timerRemaining ? item.timerRemaining % 60 : 0;
            const canAfford = xp >= item.cost;
            
            return (
              <div 
                key={item.id} 
                className={`border p-5 flex flex-col justify-between transition-all duration-300 min-h-[180px] ${
                  item.unlocked 
                    ? "border-emerald bg-[#0A0A0A] unlocked-pulse" 
                    : "border-surface-variant bg-surface-container-high hover:border-outline"
                }`}
              >
                {/* Header info */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[28px] ${
                      item.unlocked ? "text-emerald" : "text-outline-variant"
                    }`}>
                      {item.icon}
                    </span>
                    <div>
                      <span className="font-technical-prefix text-[8px] text-outline-variant">PROCESS_NODE</span>
                      <h3 className="font-log-body font-bold text-sm text-primary uppercase">{item.name}</h3>
                    </div>
                  </div>

                  {item.unlocked ? (
                    <span className="px-2 py-0.5 border border-emerald font-technical-prefix text-[8px] text-emerald bg-emerald/10 font-bold uppercase">
                      BYPASS_GRANTED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 border border-outline-variant font-technical-prefix text-[8px] text-outline-variant uppercase">
                      RESTRICTED
                    </span>
                  )}
                </div>

                {/* Footer details & Action */}
                <div className="flex justify-between items-end mt-auto">
                  <div className="flex flex-col gap-2">
                    {item.unlocked ? (
                      <div className="flex flex-col">
                        <span className="font-technical-prefix text-[8px] text-emerald uppercase">AUTH_EXPIRY</span>
                        <span className="font-log-body text-emerald font-bold text-sm">
                          {min.toString().padStart(2, '0')}:{sec.toString().padStart(2, '0')} min
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col">
                          <span className="font-technical-prefix text-[8px] text-outline-variant uppercase">BYPASS_COST</span>
                          <span className="font-log-body text-amber font-bold text-sm">
                            {item.cost} XP
                          </span>
                        </div>
                        {!canAfford && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleRequestWaiver("math")}
                              className="px-2 py-1 border border-amber/40 hover:bg-amber/15 text-amber text-[8px] font-technical-prefix uppercase font-bold"
                              title="Solve algebra to unlock"
                            >
                              Math Waiver
                            </button>
                            <button
                              onClick={() => handleRequestWaiver("essay")}
                              className="px-2 py-1 border border-amber/40 hover:bg-amber/15 text-amber text-[8px] font-technical-prefix uppercase font-bold"
                              title="Write short essay to unlock"
                            >
                              Essay Waiver
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {item.unlocked ? (
                    <button 
                      disabled 
                      className="px-4 py-2 border border-emerald/50 text-emerald/50 font-technical-prefix text-[10px] font-bold uppercase cursor-not-allowed"
                    >
                      AUTHORIZED
                    </button>
                  ) : (
                    <button
                      onClick={() => purchaseApp(item.id)}
                      disabled={!canAfford}
                      className={`px-4 py-2 font-technical-prefix text-[10px] font-bold uppercase transition-all btn-tactical ${
                        canAfford 
                          ? "bg-primary text-background hover:bg-white" 
                          : "border border-outline-variant/30 text-outline-variant/30 cursor-not-allowed"
                      }`}
                    >
                      ACQUIRE_BYPASS
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Waiver Modal Overlay */}
      {activeWaiverTask && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 z-[1000]">
          <div className="w-full max-w-lg border border-amber/60 bg-surface-container-lowest p-6 flex flex-col gap-4">
            <div>
              <div className="font-technical-prefix text-technical-prefix text-amber uppercase mb-1">
                AI_WAIVER_CHALLENGE
              </div>
              <h3 className="font-log-body font-bold text-sm text-primary uppercase">
                Resolve Task for +500 XP
              </h3>
            </div>

            <div className="p-4 border border-outline-variant bg-background font-technical-prefix text-xs text-amber italic select-text">
              {activeWaiverTask.prompt}
            </div>

            <form onSubmit={handleVerifyWaiver} className="flex flex-col gap-3">
              {activeWaiverTask.type === "math" ? (
                <input
                  type="text"
                  placeholder="ENTER NUMERIC ANSWER..."
                  value={waiverAnswer}
                  onChange={(e) => setWaiverAnswer(e.target.value)}
                  className="w-full bg-background border border-outline-variant text-on-surface px-3 py-2 font-technical-prefix text-xs outline-none"
                />
              ) : (
                <textarea
                  rows={4}
                  placeholder="EXPLAIN CONCEPT IN MINIMUM 10 WORDS..."
                  value={waiverAnswer}
                  onChange={(e) => setWaiverAnswer(e.target.value)}
                  className="w-full bg-background border border-outline-variant text-on-surface p-3 font-technical-prefix text-xs outline-none focus:border-amber"
                />
              )}

              {waiverMsg && (
                <div className="text-amber font-technical-prefix text-[10px] uppercase mt-2">
                  {waiverMsg}
                </div>
              )}

              <div className="flex gap-2 mt-4 justify-end">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-6 py-2 bg-emerald text-background font-technical-prefix text-[10px] uppercase font-bold hover:bg-green-400"
                >
                  {isVerifying ? "Verifying..." : "Submit Answer"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWaiverTask(null)}
                  className="px-4 py-2 border border-outline-variant hover:bg-surface-container-high font-technical-prefix text-[10px] uppercase text-primary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultPage;
