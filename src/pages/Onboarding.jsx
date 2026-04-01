import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../stores/AuthContext";

const STEPS = [
  {
    title: "Where are you in your faith journey?",
    key: "faithStage",
    options: [
      { value: "searching", label: "Searching", desc: "Exploring what the Bible says" },
      { value: "new_believer", label: "New Believer", desc: "Recently came to faith" },
      { value: "growing", label: "Growing", desc: "Building a deeper foundation" },
      { value: "mature", label: "Mature", desc: "Years of walking with God" },
    ],
  },
  {
    title: "What are your study goals?",
    key: "goals",
    multi: true,
    options: [
      { value: "devotional", label: "Daily Devotional", desc: "Consistent quiet time" },
      { value: "deep_study", label: "Deep Study", desc: "Word studies and theology" },
      { value: "memorization", label: "Memorization", desc: "Committing scripture to memory" },
      { value: "prayer", label: "Prayer Life", desc: "Scripture-guided prayer" },
    ],
  },
  {
    title: "What topics interest you most?",
    key: "topics",
    multi: true,
    options: [
      { value: "salvation", label: "Salvation" },
      { value: "faith", label: "Faith & Trust" },
      { value: "love", label: "God's Love" },
      { value: "wisdom", label: "Wisdom" },
      { value: "prayer", label: "Prayer" },
      { value: "hope", label: "Hope" },
      { value: "forgiveness", label: "Forgiveness" },
      { value: "spiritual_warfare", label: "Spiritual Warfare" },
    ],
  },
];

const READING_PLANS = {
  searching: { plan: "Gospel of John", book: "John", desc: "Start with the heart of the gospel" },
  new_believer: { plan: "Romans", book: "Romans", desc: "The foundation of Christian doctrine" },
  growing: { plan: "Psalms & Proverbs", book: "Psalms", desc: "Wisdom and worship for daily life" },
  mature: { plan: "Genesis to Revelation", book: "Genesis", desc: "Read through the entire Bible" },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { saveProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    faithStage: "",
    goals: [],
    topics: [],
  });

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const handleSelect = (value) => {
    if (currentStep.multi) {
      setAnswers((prev) => ({
        ...prev,
        [currentStep.key]: prev[currentStep.key].includes(value)
          ? prev[currentStep.key].filter((v) => v !== value)
          : [...prev[currentStep.key], value],
      }));
    } else {
      setAnswers((prev) => ({ ...prev, [currentStep.key]: value }));
    }
  };

  const isSelected = (value) => {
    if (currentStep.multi) {
      return answers[currentStep.key].includes(value);
    }
    return answers[currentStep.key] === value;
  };

  const canProceed = currentStep.multi
    ? answers[currentStep.key].length > 0
    : answers[currentStep.key] !== "";

  const handleNext = () => {
    if (isLastStep) {
      const plan = READING_PLANS[answers.faithStage] || READING_PLANS.growing;
      const profileData = {
        ...answers,
        readingPlan: plan.plan,
        suggestedBook: plan.book,
      };
      saveProfile(profileData);
      navigate(`/read/${encodeURIComponent(plan.book)}/1`);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-8 bg-gold" : i < step ? "w-2 bg-gold/50" : "w-2 bg-cream-dark"
            }`}
          />
        ))}
      </div>

      <h1 className="text-xl font-bold text-warm-brown text-center mb-8">
        {currentStep.title}
      </h1>

      <div className={`grid ${currentStep.multi && currentStep.options.length > 4 ? "grid-cols-2" : "grid-cols-1"} gap-3 mb-8`}>
        {currentStep.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
              isSelected(opt.value)
                ? "border-gold bg-gold/5"
                : "border-cream-dark bg-white hover:border-gold/30"
            }`}
          >
            <span className={`text-sm font-medium ${isSelected(opt.value) ? "text-gold" : "text-warm-brown"}`}>
              {opt.label}
            </span>
            {opt.desc && (
              <p className="text-xs text-warm-brown-light mt-0.5">{opt.desc}</p>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="text-sm text-warm-brown-light hover:text-warm-brown"
          >
            Back
          </button>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="text-sm text-warm-brown-light hover:text-warm-brown"
          >
            Skip
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="bg-gold text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-gold/90 disabled:opacity-40 transition-colors"
        >
          {isLastStep ? "Start Reading" : "Next"}
        </button>
      </div>
    </div>
  );
}
