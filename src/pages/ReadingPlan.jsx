import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PLANS, getTodaysReading } from "../data/readingPlanData";

export default function ReadingPlan() {
  const [planState, setPlanState] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("activePlan");
    if (stored) setPlanState(JSON.parse(stored));
  }, []);

  const startPlan = (planId) => {
    const state = {
      planId,
      startDate: new Date().toISOString().split("T")[0],
      completedDays: [],
    };
    localStorage.setItem("activePlan", JSON.stringify(state));
    setPlanState(state);
  };

  const endPlan = () => {
    localStorage.removeItem("activePlan");
    setPlanState(null);
  };

  const markDayComplete = (dayNum) => {
    if (!planState) return;
    const updated = {
      ...planState,
      completedDays: [...new Set([...planState.completedDays, dayNum])],
    };
    localStorage.setItem("activePlan", JSON.stringify(updated));
    setPlanState(updated);
  };

  const today = planState ? getTodaysReading(planState.planId, planState.startDate) : null;
  const activePlan = planState ? PLANS.find((p) => p.id === planState.planId) : null;
  const isDayComplete = today ? planState.completedDays.includes(today.day) : false;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-warm-brown mb-1">Reading Plans</h1>
      <p className="text-sm text-warm-brown-light mb-6">Structured daily reading</p>

      {/* Active plan — today's reading */}
      {activePlan && today && (
        <div className="bg-scripture-bg rounded-2xl p-5 mb-6 border border-cream-dark">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-gold uppercase tracking-wider">{activePlan.name}</p>
              <p className="text-sm text-warm-brown-light">Day {today.day} of {today.totalDays}</p>
            </div>
            <button onClick={endPlan} className="text-[10px] text-warm-brown-light hover:text-red-400">End Plan</button>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-cream-dark rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${(today.day / today.totalDays) * 100}%` }} />
          </div>

          {/* Today's readings */}
          <p className="text-xs font-semibold text-warm-brown uppercase tracking-wider mb-2">Today's Reading</p>
          <div className="space-y-2 mb-4">
            {today.readings.map((r, i) => (
              <Link
                key={i}
                to={`/read/${encodeURIComponent(r.book)}/${r.chapter}`}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-cream-dark hover:border-gold/30 transition-colors"
              >
                <span className="text-sm font-medium text-warm-brown">{r.book} {r.chapter}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gold">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </Link>
            ))}
          </div>

          {/* Mark complete */}
          <button
            onClick={() => markDayComplete(today.day)}
            disabled={isDayComplete}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isDayComplete
                ? "bg-green-100 text-green-600"
                : "bg-gold text-white hover:bg-gold/90"
            }`}
          >
            {isDayComplete ? "Day Complete" : "Mark Day as Complete"}
          </button>

          <p className="text-[10px] text-warm-brown-light/50 text-center mt-2">
            {planState.completedDays.length} of {today.totalDays} days completed
          </p>
        </div>
      )}

      {/* Plan ended or no reading today */}
      {activePlan && !today && (
        <div className="bg-green-50 rounded-2xl p-5 mb-6 border border-green-200 text-center">
          <p className="text-lg font-semibold text-green-700 mb-1">Plan Complete!</p>
          <p className="text-sm text-green-600">You finished {activePlan.name}</p>
          <button onClick={endPlan} className="mt-3 text-xs text-green-500 hover:text-green-700">Start a new plan</button>
        </div>
      )}

      {/* Available plans */}
      <p className="text-xs font-semibold text-warm-brown-light uppercase tracking-wider mb-3">
        {planState ? "Other Plans" : "Choose a Plan"}
      </p>
      <div className="space-y-3">
        {PLANS.map((plan) => {
          const isActive = planState?.planId === plan.id;
          const days = plan.getDays();
          return (
            <div key={plan.id} className={`bg-white rounded-xl p-4 border transition-colors ${isActive ? "border-gold" : "border-cream-dark"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-warm-brown">{plan.name}</h3>
                  <p className="text-xs text-warm-brown-light mt-0.5">{plan.desc}</p>
                  <p className="text-[10px] text-warm-brown-light/60 mt-1">{days.length} days</p>
                </div>
                {!isActive && (
                  <button
                    onClick={() => startPlan(plan.id)}
                    className="text-xs bg-gold/10 text-gold px-3 py-1.5 rounded-full font-medium hover:bg-gold/20 transition-colors"
                  >
                    Start
                  </button>
                )}
                {isActive && (
                  <span className="text-[10px] bg-gold text-white px-2 py-1 rounded-full">Active</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
