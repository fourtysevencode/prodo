import React, { useState } from "react";
import { useFocus } from "../context/FocusContext";
import { useNavigate } from "react-router-dom";

const PunishmentsPage: React.FC = () => {
  const { xp, executeCommand, setIsAuthenticated, stopTracking } = useFocus();
  const navigate = useNavigate();
  const [activeTask, setActiveTask] = useState<"math" | "typing" | null>(null);
  
  // Math Task State
  const [mathAnswers, setMathAnswers] = useState({ q1: "", q2: "", q3: "" });
  const [mathMsg, setMathMsg] = useState<string | null>(null);

  // Typing Task State
  const targetPassage = "I will respect my core developer schedule and avoid distracting tabs during deep work intervals.";
  const [typedText, setTypedText] = useState("");
  const [typingMsg, setTypingMsg] = useState<string | null>(null);

  const handleVerifyMath = (e: React.FormEvent) => {
    e.preventDefault();
    const ans1 = mathAnswers.q1.trim();
    const ans2 = mathAnswers.q2.trim();
    const ans3 = mathAnswers.q3.trim();

    if (ans1 === "8" && ans2 === "12" && ans3 === "4") {
      setMathMsg("✓ MATH_VERIFY_OK. Applying +250 XP to core profile nodes.");
      // Use command line cheat to add XP directly in context
      setTimeout(() => {
        executeCommand("addxp 250");
        setActiveTask(null);
        setMathAnswers({ q1: "", q2: "", q3: "" });
        setMathMsg(null);
        navigate("/focus");
      }, 1500);
    } else {
      setMathMsg("❌ MATH_VERIFY_FAIL: Incorrect solutions. Try again.");
    }
  };

  const handleVerifyTyping = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedText.trim() === targetPassage) {
      setTypingMsg("✓ TYPING_VERIFY_OK. Applying +250 XP to core profile nodes.");
      setTimeout(() => {
        executeCommand("addxp 250");
        setActiveTask(null);
        setTypedText("");
        setTypingMsg(null);
        navigate("/focus");
      }, 1500);
    } else {
      setTypingMsg("❌ TYPING_VERIFY_FAIL: Character mismatch detected. Ensure spacing and capitalization match exactly.");
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-on-surface flex items-center justify-center font-log-body p-6 select-none z-[9999] absolute inset-0">
      <div className="w-full max-w-2xl border-2 border-crimson bg-surface-container-lowest flex flex-col">
        
        {/* Header Warning */}
        <div className="border-b border-crimson bg-[#1C0000] px-6 py-3 flex justify-between items-center text-xs font-technical-prefix text-crimson">
          <span className="blink-cursor font-bold">⚠️ SYSTEM_LOCKDOWN_ACTIVE</span>
          <span className="font-bold">NEGATIVE_BALANCE: {xp} XP</span>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="border-b border-surface-variant pb-4">
            <h1 className="font-value-lg text-[28px] text-crimson uppercase tracking-wider">
              Cognitive Punishment Node
            </h1>
            <p className="font-technical-prefix text-[10px] text-outline-variant uppercase mt-1">
              Your points balance has dropped below zero. Resolve one enforcer task to restore authority.
            </p>
          </div>

          {!activeTask ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Math solver */}
              <div className="border border-outline-variant p-5 flex flex-col gap-3 bg-background hover:border-amber/60 transition-all">
                <span className="material-symbols-outlined text-[32px] text-amber">calculate</span>
                <h3 className="font-bold text-sm text-primary">ALGEBRA SOLVER</h3>
                <p className="text-[11px] text-outline-variant">
                  Solve 3 linear algebra equations to regain XP (+250 XP).
                </p>
                <button
                  onClick={() => setActiveTask("math")}
                  className="mt-auto py-2 border border-amber/40 hover:bg-amber/10 font-technical-prefix text-[10px] text-amber uppercase font-bold"
                >
                  Select Protocol
                </button>
              </div>

              {/* Option 2: Typing test */}
              <div className="border border-outline-variant p-5 flex flex-col gap-3 bg-background hover:border-amber/60 transition-all">
                <span className="material-symbols-outlined text-[32px] text-amber">keyboard</span>
                <h3 className="font-bold text-sm text-primary">TEDIOUS TYPING TEST</h3>
                <p className="text-[11px] text-outline-variant">
                  Type a tedious, long enforcer passage perfectly (+250 XP).
                </p>
                <button
                  onClick={() => setActiveTask("typing")}
                  className="mt-auto py-2 border border-amber/40 hover:bg-amber/10 font-technical-prefix text-[10px] text-amber uppercase font-bold"
                >
                  Select Protocol
                </button>
              </div>
            </div>
          ) : activeTask === "math" ? (
            <form onSubmit={handleVerifyMath} className="flex flex-col gap-4">
              <div className="font-technical-prefix text-[10px] text-outline-variant uppercase mb-2">
                &gt; EQUATION_SETS
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-technical-prefix text-xs w-28 text-outline-variant">Q1: 3x - 12 = 12</span>
                  <input
                    type="text" placeholder="x = ?" value={mathAnswers.q1}
                    onChange={(e) => setMathAnswers(prev => ({ ...prev, q1: e.target.value }))}
                    className="w-24 bg-background border border-outline-variant text-on-surface px-3 py-1 font-technical-prefix text-xs outline-none text-center"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-technical-prefix text-xs w-28 text-outline-variant">Q2: 4x / 2 = 24</span>
                  <input
                    type="text" placeholder="x = ?" value={mathAnswers.q2}
                    onChange={(e) => setMathAnswers(prev => ({ ...prev, q2: e.target.value }))}
                    className="w-24 bg-background border border-outline-variant text-on-surface px-3 py-1 font-technical-prefix text-xs outline-none text-center"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-technical-prefix text-xs w-28 text-outline-variant">Q3: 9x + 8 = 44</span>
                  <input
                    type="text" placeholder="x = ?" value={mathAnswers.q3}
                    onChange={(e) => setMathAnswers(prev => ({ ...prev, q3: e.target.value }))}
                    className="w-24 bg-background border border-outline-variant text-on-surface px-3 py-1 font-technical-prefix text-xs outline-none text-center"
                  />
                </div>
              </div>

              {mathMsg && <div className="text-amber font-technical-prefix text-[10px] uppercase mt-2">{mathMsg}</div>}

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald text-background font-technical-prefix text-[10px] uppercase font-bold hover:bg-green-400"
                >
                  Verify Answers
                </button>
                <button
                  type="button" onClick={() => setActiveTask(null)}
                  className="px-4 py-2 border border-outline-variant hover:bg-surface-container-high font-technical-prefix text-[10px] uppercase text-primary"
                >
                  Back
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyTyping} className="flex flex-col gap-4">
              <div className="font-technical-prefix text-[10px] text-outline-variant uppercase mb-1">
                &gt; TARGET_PASSAGE (Type exactly)
              </div>
              <div className="p-4 border border-outline-variant bg-background font-technical-prefix text-[11px] text-amber italic select-text">
                {targetPassage}
              </div>

              <textarea
                rows={3}
                placeholder="TYPE TARGET PASSAGE HERE..."
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="w-full bg-background border border-outline-variant text-on-surface p-3 font-technical-prefix text-xs outline-none focus:border-amber"
              />

              {typingMsg && <div className="text-amber font-technical-prefix text-[10px] uppercase mt-2">{typingMsg}</div>}

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald text-background font-technical-prefix text-[10px] uppercase font-bold hover:bg-green-400"
                >
                  Verify Text
                </button>
                <button
                  type="button" onClick={() => setActiveTask(null)}
                  className="px-4 py-2 border border-outline-variant hover:bg-surface-container-high font-technical-prefix text-[10px] uppercase text-primary"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-surface-variant pt-4 mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("prodo_token");
                sessionStorage.removeItem("prodo_token");
                setIsAuthenticated(false);
                stopTracking();
                navigate("/login");
              }}
              className="px-4 py-2 border border-crimson/50 hover:bg-crimson/10 font-technical-prefix text-[10px] uppercase text-crimson font-bold transition-all animate-pulse"
            >
              Logout / Reset Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunishmentsPage;
