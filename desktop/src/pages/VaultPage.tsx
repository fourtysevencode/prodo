import React, { useState } from "react";
import { useFocus } from "../context/FocusContext";
import { apiGenerateAITask, apiVerifyAITask } from "../api/prodoApi";
import type { AITaskResponse } from "../api/prodoApi";

/**
 * VaultPage - Immersive dark vault and break-time shop.
 * Uses neon rounded cards, duration slider, AI cognitive waiver challenges, and bright accents.
 */
const VaultPage: React.FC = () => {
  const { xp, breakTimeRemaining, purchaseBreakTime } = useFocus();

  const [secondsToBuy, setSecondsToBuy] = useState(300);
  const [purchaseFeedback, setPurchaseFeedback] = useState<string | null>(null);

  const [activeWaiverTask, setActiveWaiverTask] = useState<AITaskResponse | null>(null);
  const [waiverAnswer, setWaiverAnswer] = useState("");
  const [waiverMsg, setWaiverMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const cost = Math.ceil(secondsToBuy / 60) * 10;
  const canAfford = xp >= cost;

  const handleBuy = () => {
    if (purchaseBreakTime(secondsToBuy)) {
      setPurchaseFeedback(`✓ SUCCESS: Unlocked break time for +${secondsToBuy} seconds!`);
      setTimeout(() => setPurchaseFeedback(null), 3000);
    } else {
      setPurchaseFeedback(`❌ ERROR: Insufficient XP balance.`);
      setTimeout(() => setPurchaseFeedback(null), 3000);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
      alert("❌ FAIL: Failed to communicate with AI generation server.");
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
    <div className="flex flex-col gap-6 pb-12 mt-8">
      
      {/* Header Card */}
      <div className="bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-on-surface/50 uppercase tracking-widest">
            STORE & RECOVERY PROTOCOL
          </span>
          <h1 className="text-3xl font-display font-black text-on-surface tracking-tight mt-1">
            Distraction Vault & Break Time
          </h1>
        </div>

        {/* XP Balance Badge */}
        <div className="bg-background/80 border border-lavender/50 rounded-full px-5 py-2.5 flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-secondary text-xl">bolt</span>
          <span className="text-[10px] font-black text-on-surface/50 uppercase">AVAILABLE XP</span>
          <span className="text-lg font-black text-on-surface">{(xp || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Main Grid: Break Time Store & AI Waiver Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Break Time Store */}
        <div className="lg:col-span-2 bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex flex-col justify-between gap-6">
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center font-bold text-2xl">
                <span className="material-symbols-outlined text-2xl">coffee</span>
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-on-surface">Acquire Break Time Pass</h3>
                <p className="text-xs text-on-surface/60 font-medium">
                  Temporarily pause AI gaze telemetry blocks to relax without streak penalties.
                </p>
              </div>
            </div>

            {/* Active Break Timer Display */}
            {breakTimeRemaining > 0 && (
              <div className="bg-secondary/10 border-2 border-secondary/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-secondary animate-pulse"></span>
                  <div>
                    <span className="text-[10px] font-black text-secondary uppercase tracking-wider">BREAK PASS ACTIVE</span>
                    <p className="text-xs text-secondary/80 font-medium">Telemetry monitoring paused.</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-secondary">{formatTime(breakTimeRemaining)}</span>
              </div>
            )}

            {/* Duration Slider & Quick Selector */}
            <div className="flex flex-col gap-4 bg-background/50 border border-lavender/50 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-on-surface/50 uppercase tracking-wider">SELECT DURATION</span>
                <span className="text-lg font-black text-primary">{formatTime(secondsToBuy)} ({secondsToBuy}s)</span>
              </div>

              <input
                type="range"
                min="60"
                max="3600"
                step="60"
                value={secondsToBuy}
                onChange={(e) => setSecondsToBuy(Number(e.target.value))}
                className="w-full accent-primary bg-surface/50 cursor-pointer h-2 rounded-lg"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSecondsToBuy((prev) => Math.min(3600, prev + 60))}
                  className="flex-1 bg-surface hover:bg-surface/80 text-on-surface border border-lavender/50 rounded-full py-2 text-xs font-bold transition-colors"
                >
                  +1 Min
                </button>
                <button
                  onClick={() => setSecondsToBuy((prev) => Math.min(3600, prev + 300))}
                  className="flex-1 bg-surface hover:bg-surface/80 text-on-surface border border-lavender/50 rounded-full py-2 text-xs font-bold transition-colors"
                >
                  +5 Min
                </button>
                <button
                  onClick={() => setSecondsToBuy((prev) => Math.min(3600, prev + 900))}
                  className="flex-1 bg-surface hover:bg-surface/80 text-on-surface border border-lavender/50 rounded-full py-2 text-xs font-bold transition-colors"
                >
                  +15 Min
                </button>
                <button
                  onClick={() => setSecondsToBuy(300)}
                  className="bg-surface hover:bg-heart-red/10 text-heart-red border border-lavender/50 rounded-full px-4 py-2 text-xs font-bold transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="flex items-center justify-between pt-2 border-t border-lavender/30">
              <span className="text-[10px] font-bold text-on-surface/50 uppercase tracking-wider">XP COST</span>
              <span className="text-lg font-black text-secondary drop-shadow-[0_0_8px_rgba(0,245,255,0.4)]">{(cost || 0).toLocaleString()} XP</span>
            </div>

            {purchaseFeedback && (
              <div className={`text-center font-bold text-xs p-3 rounded-xl border ${purchaseFeedback.includes('SUCCESS') ? 'bg-secondary/10 text-secondary border-secondary/30' : 'bg-heart-red/10 text-heart-red border-heart-red/30'}`}>
                {purchaseFeedback}
              </div>
            )}
          </div>

          <button
            onClick={handleBuy}
            disabled={!canAfford}
            className={`w-full py-4 rounded-full font-extrabold text-[10px] uppercase tracking-widest transition-all ${
              canAfford
                ? "bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/30 active:scale-95 btn-bubbly border-none"
                : "bg-surface/50 text-on-surface/30 border border-lavender/50 cursor-not-allowed"
            }`}
          >
            {canAfford ? "PURCHASE BREAK TIME PASS" : "INSUFFICIENT XP BALANCE"}
          </button>

        </div>

        {/* Right 1 Col: AI Waiver Challenge */}
        <div className="lg:col-span-1 bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-tertiary/20 text-tertiary flex items-center justify-center font-bold text-xl">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-on-surface">Request AI Waiver</h3>
                <p className="text-[10px] text-on-surface/60 font-medium">Earn +500 XP by solving AI challenges.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={() => handleRequestWaiver("math")}
                className="w-full bg-background/50 hover:bg-surface border border-tertiary/50 text-tertiary font-extrabold text-[10px] uppercase tracking-wider py-3.5 px-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">functions</span>
                <span>Cognitive Algebra (+500 XP)</span>
              </button>

              <button
                onClick={() => handleRequestWaiver("essay")}
                className="w-full bg-background/50 hover:bg-surface border border-tertiary/50 text-tertiary font-extrabold text-[10px] uppercase tracking-wider py-3.5 px-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">edit_note</span>
                <span>Philosophical Concept (+500 XP)</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* AI Waiver Modal Dialog */}
      {activeWaiverTask && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-lavender rounded-[32px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xs text-on-surface uppercase tracking-wider">
                AI COGNITIVE CHALLENGE <span className="text-tertiary">(+500 XP)</span>
              </h3>
              <button
                onClick={() => setActiveWaiverTask(null)}
                className="text-on-surface/40 hover:text-on-surface text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-background/50 border border-lavender/50 rounded-2xl p-4 text-xs font-semibold text-on-surface/80 leading-relaxed">
              {activeWaiverTask.prompt}
            </div>

            <form onSubmit={handleVerifyWaiver} className="flex flex-col gap-3">
              {activeWaiverTask.type === "math" ? (
                <input
                  type="text"
                  placeholder="Enter numeric answer..."
                  value={waiverAnswer}
                  onChange={(e) => setWaiverAnswer(e.target.value)}
                  className="w-full bg-background border border-lavender rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:bg-surface focus:border-primary"
                />
              ) : (
                <textarea
                  rows={4}
                  placeholder="Explain concept in minimum 10 words..."
                  value={waiverAnswer}
                  onChange={(e) => setWaiverAnswer(e.target.value)}
                  className="w-full bg-background border border-lavender rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:bg-surface focus:border-primary"
                />
              )}

              {waiverMsg && (
                <div className={`text-[10px] font-black p-3 rounded-xl border ${waiverMsg.includes('SUCCESS') ? 'bg-secondary/10 text-secondary border-secondary/30' : 'bg-heart-red/10 text-heart-red border-heart-red/30'}`}>
                  {waiverMsg}
                </div>
              )}

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setActiveWaiverTask(null)}
                  className="px-5 py-2.5 rounded-full border border-lavender text-on-surface/60 text-xs font-bold hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-6 py-2.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider hover:bg-primary/80 shadow-md shadow-primary/20 transition-colors"
                >
                  {isVerifying ? "VERIFYING..." : "SUBMIT ANSWER"}
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
