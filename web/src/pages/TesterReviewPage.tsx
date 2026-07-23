import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFocus } from "../context/FocusContext";
import { apiSendTelemetry, apiTesterLogin } from "../api/prodoApi";

/**
 * Tester Review & Lockout Page.
 * Displayed when a 5-minute tester session expires.
 * Prompts user for feedback, telemetry consent, or starting a new 5-minute session.
 */
const TesterReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated, startTracking } = useFocus();

  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState("");
  const [allowTelemetry, setAllowTelemetry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearTesterSession = () => {
    localStorage.removeItem("prodo_token");
    setIsAuthenticated(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (allowTelemetry) {
        await apiSendTelemetry("TESTER_REVIEW_SUBMITTED", {
          rating,
          feedback,
          allowTelemetry,
        });
      }
      clearTesterSession();
      navigate("/landing");
    } catch (err) {
      console.error("Failed to submit review:", err);
      clearTesterSession();
      navigate("/landing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipReview = () => {
    clearTesterSession();
    navigate("/landing");
  };

  const handleStartNewTesterSession = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiTesterLogin();
      if (res.success && res.token) {
        localStorage.setItem("prodo_token", res.token);
        setIsAuthenticated(true);
        startTracking();
        navigate("/focus");
      } else {
        clearTesterSession();
        navigate("/login");
      }
    } catch (err) {
      clearTesterSession();
      navigate("/login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-on-surface flex items-center justify-center p-6 select-none relative font-log-body">
      <div className="w-full max-w-lg bg-surface-container-lowest border-2 border-amber p-8 flex flex-col gap-6 text-center shadow-2xl">
        
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-amber/10 border border-amber rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px] text-amber animate-pulse">timer_off</span>
          </div>
          <h1 className="font-value-lg text-[26px] text-amber uppercase">5-MINUTE TESTER SESSION EXPIRED</h1>
          <p className="font-technical-prefix text-[10px] text-outline-variant uppercase tracking-wider">
            YOUR TESTING SESSION HAS CONCLUDED. WE VALUE YOUR FEEDBACK!
          </p>
        </div>

        {/* Review & Feedback Form */}
        <form onSubmit={handleSubmitReview} className="flex flex-col gap-4 text-left border-t border-b border-surface-variant py-4">
          <div>
            <label className="font-technical-prefix text-[9px] text-outline-variant uppercase block mb-2">
              SESSION RATING (1 TO 5 STARS)
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-[28px] transition-transform ${
                    star <= rating ? "text-amber scale-110" : "text-outline-variant opacity-40"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-technical-prefix text-[9px] text-outline-variant uppercase block mb-1">
              TESTER FEEDBACK & SUGGESTIONS
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What worked well? Any suggestions for Prodo Focus Engine?"
              className="w-full bg-surface-container-high border border-outline-variant p-3 font-log-body text-xs text-primary outline-none focus:border-amber"
            />
          </div>

          {/* Telemetry Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={allowTelemetry}
              onChange={(e) => setAllowTelemetry(e.target.checked)}
              className="w-4 h-4 accent-amber bg-background border-outline-variant"
            />
            <span className="font-technical-prefix text-[9px] text-on-surface-variant uppercase">
              ALLOW ANONYMOUS TELEMETRY DATA TO BE SENT TO DEV.PRODO.LIVE
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-amber hover:bg-amber-400 text-background font-technical-prefix text-xs font-bold uppercase transition-colors mt-2"
          >
            {isSubmitting ? "Submitting..." : "Submit Review & Exit"}
          </button>
        </form>

        {/* Alternative Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSkipReview}
            disabled={isSubmitting}
            className="flex-1 py-3 border border-outline-variant hover:border-primary text-outline hover:text-primary font-technical-prefix text-[10px] uppercase transition-colors"
          >
            Skip & Return to Landing Page
          </button>
          <button
            onClick={handleStartNewTesterSession}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-emerald/20 border border-emerald hover:bg-emerald/30 text-emerald font-technical-prefix text-[10px] font-bold uppercase transition-colors"
          >
            ⚡ Start New 5-Min Tester Session
          </button>
        </div>

      </div>
    </div>
  );
};

export default TesterReviewPage;
