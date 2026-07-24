import React, { useState } from "react";
import { useFocus } from "../../context/FocusContext";
import { apiGenerateAITask, apiVerifyAITask } from "../../api/prodoApi";
import type { AITaskResponse } from "../../api/prodoApi";

/**
 * WhimsicalVaultPage - Bright, cheerful vault and break-time shop for beta.prodo.live.
 * Uses soft rounded cards, duration slider, AI cognitive waiver challenges, and royal blue buttons.
 */
const WhimsicalVaultPage: React.FC = () => {
  const { xp, breakTimeRemaining, purchaseBreakTime } = useFocus();

  const [secondsToBuy, setSecondsToBuy] = useState(300);
  const [purchaseFeedback, setPurchaseFeedback] = useState<string | null>(null);

  const [activeWaiverTask, setActiveWaiverTask] = useState<AITaskResponse | null>(null);
  const [waiverAnswer, setWaiverAnswer] = useState("");
  const [waiverMsg, setWaiverMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const cost = secondsToBuy * 5;
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
    <div className="flex flex-col gap-6 pb-12 relative">
      
      {/* Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            STORE & RECOVERY PROTOCOL
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Distraction Vault & Break Time
          </h1>
        </div>

        {/* XP Balance Badge */}
        <div className="bg-blue-50 border border-blue-200 rounded-full px-5 py-2.5 flex items-center gap-2 shadow-2xs">
          <span className="material-symbols-outlined text-amber-500 text-xl">bolt</span>
          <span className="text-xs font-extrabold text-slate-500 uppercase">AVAILABLE XP</span>
          <span className="text-lg font-black text-[#0047AB]">{xp.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Grid: Break Time Store & AI Waiver Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Break Time Store */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-6">
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0047AB] flex items-center justify-center font-bold text-2xl shadow-xs">
                <span className="material-symbols-outlined text-2xl">coffee</span>
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-slate-900">Acquire Break Time Pass</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Temporarily pause AI gaze telemetry blocks to relax without streak penalties.
                </p>
              </div>
            </div>

            {/* Active Break Timer Display */}
            {breakTimeRemaining > 0 && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <div>
                    <span className="text-xs font-extrabold text-emerald-900 uppercase">BREAK PASS ACTIVE</span>
                    <p className="text-xs text-emerald-700 font-medium">Telemetry monitoring paused.</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-emerald-700">{formatTime(breakTimeRemaining)}</span>
              </div>
            )}

            {/* Duration Slider & Quick Selector */}
            <div className="flex flex-col gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">SELECT DURATION</span>
                <span className="text-lg font-black text-[#0047AB]">{formatTime(secondsToBuy)} ({secondsToBuy}s)</span>
              </div>

              <input
                type="range"
                min="60"
                max="3600"
                step="60"
                value={secondsToBuy}
                onChange={(e) => setSecondsToBuy(Number(e.target.value))}
                className="w-full accent-[#0047AB] bg-slate-200 cursor-pointer h-2 rounded-lg"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSecondsToBuy((prev) => Math.min(3600, prev + 60))}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full py-2 text-xs font-bold transition-colors"
                >
                  +1 Min
                </button>
                <button
                  onClick={() => setSecondsToBuy((prev) => Math.min(3600, prev + 300))}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full py-2 text-xs font-bold transition-colors"
                >
                  +5 Min
                </button>
                <button
                  onClick={() => setSecondsToBuy((prev) => Math.min(3600, prev + 900))}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full py-2 text-xs font-bold transition-colors"
                >
                  +15 Min
                </button>
                <button
                  onClick={() => setSecondsToBuy(300)}
                  className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-full px-4 py-2 text-xs font-bold transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">XP COST</span>
              <span className="text-lg font-black text-amber-600">{cost.toLocaleString()} XP</span>
            </div>

            {purchaseFeedback && (
              <div className="text-center font-bold text-xs p-3 rounded-xl bg-blue-50 text-[#0047AB] border border-blue-200">
                {purchaseFeedback}
              </div>
            )}
          </div>

          <button
            onClick={handleBuy}
            disabled={!canAfford}
            className={`w-full py-4 rounded-full font-extrabold text-xs uppercase tracking-wider transition-all ${
              canAfford
                ? "bg-[#0047AB] hover:bg-blue-700 text-white shadow-md active:scale-95"
                : "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed"
            }`}
          >
            {canAfford ? "PURCHASE BREAK TIME PASS" : "INSUFFICIENT XP BALANCE"}
          </button>

        </div>

        {/* Right 1 Col: AI Waiver Challenge */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Request AI Waiver</h3>
                <p className="text-xs text-slate-400 font-medium">Earn +500 XP by solving AI cognitive challenges.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={() => handleRequestWaiver("math")}
                className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">functions</span>
                <span>Cognitive Algebra (+500 XP)</span>
              </button>

              <button
                onClick={() => handleRequestWaiver("essay")}
                className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider">
                AI COGNITIVE CHALLENGE (+500 XP)
              </h3>
              <button
                onClick={() => setActiveWaiverTask(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 leading-relaxed">
              {activeWaiverTask.prompt}
            </div>

            <form onSubmit={handleVerifyWaiver} className="flex flex-col gap-3">
              {activeWaiverTask.type === "math" ? (
                <input
                  type="text"
                  placeholder="Enter numeric answer..."
                  value={waiverAnswer}
                  onChange={(e) => setWaiverAnswer(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0047AB]"
                />
              ) : (
                <textarea
                  rows={4}
                  placeholder="Explain concept in minimum 10 words..."
                  value={waiverAnswer}
                  onChange={(e) => setWaiverAnswer(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0047AB]"
                />
              )}

              {waiverMsg && (
                <div className="text-xs font-bold p-3 rounded-xl bg-blue-50 text-[#0047AB] border border-blue-200">
                  {waiverMsg}
                </div>
              )}

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setActiveWaiverTask(null)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-6 py-2.5 rounded-full bg-[#0047AB] text-white text-xs font-extrabold hover:bg-blue-700 shadow-md transition-colors"
                >
                  {isVerifying ? "Verifying..." : "Submit Answer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default WhimsicalVaultPage;
