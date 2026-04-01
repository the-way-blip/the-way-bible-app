import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PLANS = [
  {
    id: "whole-bible",
    name: "Read the Bible in a Year",
    desc: "3-4 chapters per day, Genesis to Revelation",
    duration: "365 days",
    daily: 3,
    books: null, // all books
  },
  {
    id: "new-testament",
    name: "New Testament in 90 Days",
    desc: "The Gospels through Revelation",
    duration: "90 days",
    daily: 3,
    books: ["Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"],
  },
  {
    id: "psalms-proverbs",
    name: "Psalms & Proverbs",
    desc: "Wisdom and worship daily",
    duration: "60 days",
    daily: 3,
    books: ["Psalms", "Proverbs"],
  },
  {
    id: "gospels",
    name: "The Four Gospels",
    desc: "Walk with Jesus through Matthew, Mark, Luke, John",
    duration: "30 days",
    daily: 3,
    books: ["Matthew", "Mark", "Luke", "John"],
  },
  {
    id: "romans-deep",
    name: "Romans Deep Dive",
    desc: "One chapter per day through Paul's masterwork",
    duration: "16 days",
    daily: 1,
    books: ["Romans"],
  },
];

export default function ReadingPlan() {
  const [activePlan, setActivePlan] = useState(null);
  const [planProgress, setPlanProgress] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem("readingPlan");
    if (stored) {
      const parsed = JSON.parse(stored);
      setActivePlan(parsed.planId);
      setPlanProgress(parsed);
    }
  }, []);

  const startPlan = (planId) => {
    const plan = { planId, startDate: new Date().toISOString().split("T")[0], day: 1 };
    localStorage.setItem("readingPlan", JSON.stringify(plan));
    setActivePlan(planId);
    setPlanProgress(plan);
  };

  const currentPlan = PLANS.find((p) => p.id === activePlan);
  const today = planProgress.day || 1;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-warm-brown mb-1">Reading Plans</h1>
      <p className="text-sm text-warm-brown-light mb-6">Structured daily reading to guide your study</p>

      {currentPlan && (
        <div className="bg-scripture-bg rounded-2xl p-5 mb-6 border border-cream-dark">
          <p className="text-xs font-medium text-gold uppercase tracking-wider mb-2">Current Plan</p>
          <h2 className="text-lg font-semibold text-warm-brown">{currentPlan.name}</h2>
          <p className="text-sm text-warm-brown-light mt-1">Day {today} of {currentPlan.duration}</p>
          <div className="h-2 bg-cream-dark rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-gold rounded-full" style={{ width: `${Math.min((today / parseInt(currentPlan.duration)) * 100, 100)}%` }} />
          </div>
          <div className="mt-4 flex gap-2">
            <Link
              to={`/read/${encodeURIComponent(currentPlan.books?.[0] || "Genesis")}/1`}
              className="flex-1 bg-gold text-white rounded-lg py-2 text-center text-sm font-medium hover:bg-gold/90 transition-colors"
            >
              Today's Reading
            </Link>
            <button
              onClick={() => { localStorage.removeItem("readingPlan"); setActivePlan(null); }}
              className="text-xs text-warm-brown-light hover:text-red-400 px-3"
            >
              End Plan
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`bg-white rounded-xl p-4 border transition-colors ${activePlan === plan.id ? "border-gold" : "border-cream-dark"}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-warm-brown">{plan.name}</h3>
                <p className="text-xs text-warm-brown-light mt-0.5">{plan.desc}</p>
                <p className="text-[10px] text-warm-brown-light/60 mt-1">{plan.duration} · ~{plan.daily} chapters/day</p>
              </div>
              {activePlan !== plan.id && (
                <button
                  onClick={() => startPlan(plan.id)}
                  className="text-xs bg-gold/10 text-gold px-3 py-1.5 rounded-full font-medium hover:bg-gold/20 transition-colors"
                >
                  Start
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
