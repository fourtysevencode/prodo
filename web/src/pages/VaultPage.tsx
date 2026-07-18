import React, { useState } from "react";
import { useFocus } from "../context/FocusContext";
import { apiGenerateAITask, apiVerifyAITask } from "../api/prodoApi";
import type { AITaskResponse } from "../api/prodoApi";

const VaultPage: React.FC = () => {
  const { xp, breakTimeRemaining, purchaseBreakTime } = useFocus();

  // Shop state
  const [secondsToBuy, setSecondsToBuy] = useState(300); // default 5 minutes
  const [purchaseFeedback, setPurchaseFeedback] = useState<string | null>(null);

  // AI Waiver states
  const [activeWaiverTask, setActiveWaiverTask] = useState<AITaskResponse | null>(null);
  const [waiverAnswer, setWaiverAnswer] = useState("");
  const [waiverMsg, setWaiverMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const cost = secondsToBuy * 5;
  const canAfford = xp >= cost;

  const handleBuy = () => {
    if (purchaseBreakTime(secondsToBuy)) {
      setPurchaseFeedback(`✓ SUCCESS: Bypassed restriction node for +${secondsToBuy} seconds!`);
      setTimeout(() => setPurchaseFeedback(null), 3000);
    } else {
      setPurchaseFeedback(`❌ ERROR: Transaction declined.`);
      setTimeout(() => setPurchaseFeedback(null), 3000);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRequestWaiver = async (type: "math" | "focus" | "essay") => {
    setWaiverMsg(null);
    setWaiverAnswer("");
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

        <div className="border border-outline-variant bg-surface-container-lowest px-4 py-2 flex flex-col justify-center text-right">
          <span className="font-technical-prefix text-[8px] text-outline-variant">AVAILABLE_XP</span>
          <span className="font-value-lg text-lg text-amber">{xp.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-y-auto">
        
        {/* Left: Purchase break time node */}
        <div className="flex-1 bg-surface-container-lowest border border-outline-variant p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-6">
            
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[36px] text-primary">coffee</span>
              <div>
                <span className="font-technical-prefix text-[8px] text-outline-variant">BYPASS_UTILITY_NODE</span>
                <h3 className="font-value-lg text-xl text-primary uppercase">Buy Break Time Link</h3>
              </div>
            </div>

            <p className="font-technical-prefix text-[11px] text-outline-variant uppercase leading-relaxed">
              Acquiring break time pauses all distraction telemetry blocks. Gaze monitoring, threat timers, and background process blocks are temporarily whitelisted. Cost scales linearly at 5 XP per second.
            </p>

            {/* Pulsing Active Timer if break active */}
            {breakTimeRemaining > 0 && (
              <div className="border border-emerald/50 bg-emerald/5 p-4 flex flex-col items-center justify-center gap-1 unlocked-pulse">
                <span className="font-technical-prefix text-[9px] text-emerald uppercase tracking-widest font-bold">SYSTEM BYPASS ACTIVE</span>
                <span className="font-value-lg text-3xl text-emerald">{formatTime(breakTimeRemaining)}</span>
                <span className="font-technical-prefix text-[8px] text-emerald/70 uppercase">No penalties will be applied</span>
              </div>
            )}

            {/* Config Duration Slider / Form */}
            <div className="flex flex-col gap-4 mt-2">
              
              <div className="flex justify-between items-center">
                <span className="font-technical-prefix text-[10px] text-outline-variant uppercase">Select Duration</span>
                <span className="font-value-lg text-lg text-primary">{formatTime(secondsToBuy)} ({secondsToBuy}s)</span>
              </div>

              {/* Slider */}
              <input 
                type="range" 
                min="60" 
                max="3600" 
                step="60"
                value={secondsToBuy}
                onChange={(e) => setSecondsToBuy(Number(e.target.value))}
                className="w-full accent-primary bg-surface-container-highest cursor-pointer h-1"
              />

              {/* Quick Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setSecondsToBuy(prev => Math.min(3600, prev + 60))}
                  className="flex-1 py-1 border border-outline-variant hover:border-primary font-technical-prefix text-[9px] uppercase transition-colors"
                >
                  +1 Min
                </button>
                <button 
                  onClick={() => setSecondsToBuy(prev => Math.min(3600, prev + 300))}
                  className="flex-1 py-1 border border-outline-variant hover:border-primary font-technical-prefix text-[9px] uppercase transition-colors"
                >
                  +5 Min
                </button>
                <button 
                  onClick={() => setSecondsToBuy(prev => Math.min(3600, prev + 900))}
                  className="flex-1 py-1 border border-outline-variant hover:border-primary font-technical-prefix text-[9px] uppercase transition-colors"
                >
                  +15 Min
                </button>
                <button 
                  onClick={() => setSecondsToBuy(300)}
                  className="px-3 py-1 border border-outline-variant hover:border-crimson hover:text-crimson font-technical-prefix text-[9px] uppercase transition-colors"
                >
                  Reset
                </button>
              </div>

            </div>

            {/* Cost Summary */}
            <div className="flex justify-between border-t border-dashed border-outline-variant/30 pt-4 mt-2">
              <span className="font-technical-prefix text-[10px] text-outline-variant uppercase">Required Energy</span>
              <span className="font-value-lg text-lg text-amber">{cost.toLocaleString()} XP</span>
            </div>

            {purchaseFeedback && (
              <div className="text-center font-technical-prefix text-[10px] text-primary bg-surface-container-high py-2 border border-outline-variant">
                {purchaseFeedback}
              </div>
            )}

          </div>

          <button
            onClick={handleBuy}
            disabled={!canAfford}
            className={`w-full py-3 mt-6 font-technical-prefix text-xs font-bold uppercase transition-all ${
              canAfford 
                ? "bg-primary text-background hover:bg-white shadow-lg shadow-primary/10" 
                : "border border-outline-variant/30 text-outline-variant/30 cursor-not-allowed"
            }`}
          >
            {canAfford ? "ACQUIRE_BREAK_TIME_LINK" : "INSUFFICIENT_XP_ENERGY"}
          </button>
        </div>

        {/* Right: AI Waiver Task Box */}
        <div className="w-full lg:w-[360px] bg-surface-container-lowest border border-outline-variant p-6 flex flex-col gap-4">
          <div>
            <span className="font-technical-prefix text-[8px] text-outline-variant">XP_ACQUISITION_PROTOCOL</span>
            <h3 className="font-value-lg text-md text-primary uppercase">Request AI Waiver</h3>
          </div>
          <p className="font-technical-prefix text-[11px] text-outline-variant uppercase leading-relaxed">
            Running low on focus energy? Complete cognitive challenge waivers generated by the AI neural link to restore +500 XP directly to your node bank.
          </p>

          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => handleRequestWaiver("math")}
              className="w-full py-3 border border-amber/40 hover:bg-amber/10 text-amber font-technical-prefix text-xs uppercase font-bold transition-all"
            >
              Cognitive Algebra (+500 XP)
            </button>
            <button
              onClick={() => handleRequestWaiver("essay")}
              className="w-full py-3 border border-amber/40 hover:bg-amber/10 text-amber font-technical-prefix text-xs uppercase font-bold transition-all"
            >
              Philosophical Concept (+500 XP)
            </button>
          </div>
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
