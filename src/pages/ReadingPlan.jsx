import { useState } from "react";
import { Link } from "react-router-dom";
import PLANS, { getPlan, getCurrentDay } from "../data/readingPlans";
import useReadingPlanProgress from "../hooks/useReadingPlanProgress";
import useDocumentTitle from "../hooks/useDocumentTitle";
import usePageMeta from "../hooks/usePageMeta";
import { useToast } from "../components/Toast";

export default function ReadingPlan() {
  useDocumentTitle("Reading Plans");
  usePageMeta({
    description: "Structured Bible reading plans — Gospel of John in 21 days, Proverbs in 31, Psalms in 60, NT in 90, or the whole Bible in a year.",
    ogTitle: "Reading Plans — TheWay Bible App",
  });
  const { activeRecord, records, loading, startPlan, markDayComplete, stopPlan, resetPlan } = useReadingPlanProgress();
  const [confirmingReset, setConfirmingReset] = useState(null);
  const showToast = useToast();

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // If a plan is active, show that plan's daily view
  if (activeRecord) {
    const plan = getPlan(activeRecord.id);
    if (!plan) {
      // Plan was removed in code — gracefully reset
      stopPlan(activeRecord.id);
      return null;
    }
    return (
      <ActivePlanView
        plan={plan}
        record={activeRecord}
        onMarkComplete={(day) => markDayComplete(plan.id, day)}
        onStop={() => {
          stopPlan(plan.id);
          showToast("Plan paused — you can resume anytime.", { icon: "⏸️" });
        }}
        onReset={() => setConfirmingReset(plan.id)}
        showToast={showToast}
      />
    );
  }

  // Otherwise — show the picker
  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-bold text-warm-brown mb-1">Reading Plans</h1>
      <p className="text-sm text-warm-brown-light mb-6">
        Pick a structured plan to guide your daily reading. Pause or switch any time.
      </p>

      <div className="space-y-3">
        {PLANS.map((plan) => {
          const existing = records.find((r) => r.id === plan.id);
          const completedCount = existing ? Object.keys(existing.completedDays || {}).length : 0;
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              completedCount={completedCount}
              onStart={async () => {
                await startPlan(plan.id);
                showToast(`Started ${plan.shortName} — let's go!`, { icon: "📖" });
              }}
            />
          );
        })}
      </div>

      {confirmingReset && (
        <ConfirmModal
          message="Reset all progress for this plan? This can't be undone."
          onCancel={() => setConfirmingReset(null)}
          onConfirm={() => {
            resetPlan(confirmingReset);
            setConfirmingReset(null);
            showToast("Progress reset.", { icon: "🔄" });
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── Plan Card ─────────────────────────── */
function PlanCard({ plan, completedCount, onStart }) {
  const pct = Math.round((completedCount / plan.duration) * 100);
  const hasProgress = completedCount > 0;

  return (
    <div className="bg-white rounded-xl border border-cream-dark p-4 hover:border-gold/30 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-2xl shrink-0">
          {plan.cover}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-bold text-warm-brown">{plan.name}</h3>
          <p className="text-xs text-warm-brown-light mt-0.5 leading-relaxed">{plan.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] text-warm-brown-light flex items-center gap-2">
          <span>{plan.duration} days</span>
          {hasProgress && (
            <>
              <span>·</span>
              <span className="text-gold font-medium">{completedCount} done ({pct}%)</span>
            </>
          )}
        </div>
        <button
          onClick={onStart}
          className="bg-gold text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-gold/90 transition-colors"
        >
          {hasProgress ? "Resume" : "Start"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Active Plan View ─────────────────────────── */
function ActivePlanView({ plan, record, onMarkComplete, onStop, onReset, showToast }) {
  const currentDay = getCurrentDay(plan, record);
  const [viewingDay, setViewingDay] = useState(currentDay);
  const dayData = plan.days[viewingDay - 1];
  const isCompleted = !!(record.completedDays?.[viewingDay]);
  const completedCount = Object.keys(record.completedDays || {}).length;
  const pct = Math.round((completedCount / plan.duration) * 100);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Plan header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-2xl shrink-0">
          {plan.cover}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-warm-brown">{plan.name}</h1>
          <p className="text-xs text-warm-brown-light">{plan.description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-cream-dark rounded-full h-2 mb-1 overflow-hidden">
        <div className="bg-gold h-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-warm-brown-light mb-6">
        Day {currentDay} of {plan.duration} · {completedCount} day{completedCount === 1 ? "" : "s"} complete
      </p>

      {/* Day picker */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewingDay(Math.max(1, viewingDay - 1))}
          disabled={viewingDay <= 1}
          className="text-xs text-warm-brown-light hover:text-warm-brown disabled:opacity-30 px-2 py-1"
        >
          ← Prev
        </button>
        <p className="text-sm font-semibold text-warm-brown">Day {viewingDay}</p>
        <button
          onClick={() => setViewingDay(Math.min(plan.duration, viewingDay + 1))}
          disabled={viewingDay >= plan.duration}
          className="text-xs text-warm-brown-light hover:text-warm-brown disabled:opacity-30 px-2 py-1"
        >
          Next →
        </button>
      </div>

      {/* Today's reading */}
      <div className="bg-white rounded-xl border border-cream-dark p-4 mb-4">
        {dayData?.note && (
          <p className="text-xs text-warm-brown-light italic mb-3 leading-relaxed">{dayData.note}</p>
        )}
        <div className="space-y-2">
          {dayData?.refs.map((r, i) => (
            <Link
              key={i}
              to={`/read/${encodeURIComponent(r.book)}/${r.chapter}`}
              className="flex items-center justify-between bg-cream rounded-lg px-3 py-2.5 hover:bg-cream-dark/50 transition-colors"
            >
              <span className="text-sm font-medium text-warm-brown">{r.book} {r.chapter}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-warm-brown-light">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>

        <button
          onClick={() => {
            onMarkComplete(viewingDay);
            if (!isCompleted) showToast("Day complete!", { icon: "✅" });
          }}
          className={`w-full mt-4 py-3 rounded-full text-sm font-semibold transition-colors ${
            isCompleted
              ? "bg-gold/20 text-gold border border-gold/40"
              : "bg-gold text-white hover:bg-gold/90 shadow-lg shadow-gold/20"
          }`}
        >
          {isCompleted ? "✓ Marked complete" : "Mark Day Complete"}
        </button>
      </div>

      {/* Day grid */}
      <div className="bg-white rounded-xl border border-cream-dark p-4 mb-4">
        <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">All days</p>
        <div className="grid grid-cols-7 gap-1.5">
          {plan.days.map((_, i) => {
            const day = i + 1;
            const done = !!record.completedDays?.[day];
            const isCurrent = day === viewingDay;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setViewingDay(day)}
                aria-label={`Day ${day}${done ? " (complete)" : ""}`}
                className={`aspect-square rounded-md text-[10px] font-medium transition-colors ${
                  done
                    ? "bg-gold text-white"
                    : isCurrent
                      ? "bg-gold/20 text-gold border border-gold/40"
                      : "bg-cream text-warm-brown-light hover:bg-cream-dark"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan actions */}
      <div className="flex gap-2">
        <button
          onClick={onStop}
          className="flex-1 text-xs text-warm-brown-light hover:text-warm-brown py-2 px-3 rounded-lg border border-cream-dark hover:bg-cream-dark/40 transition-colors"
        >
          Pause plan
        </button>
        <button
          onClick={onReset}
          className="flex-1 text-xs text-warm-brown-light hover:text-red-500 py-2 px-3 rounded-lg border border-cream-dark hover:border-red-200 transition-colors"
        >
          Reset progress
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Confirm Modal ─────────────────────────── */
function ConfirmModal({ message, onCancel, onConfirm }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 pointer-events-auto animate-slide-up">
          <p className="text-sm text-warm-brown mb-4">{message}</p>
          <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 text-sm text-warm-brown-light hover:text-warm-brown py-2 rounded-lg border border-cream-dark">
              Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 bg-red-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-red-600">
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
