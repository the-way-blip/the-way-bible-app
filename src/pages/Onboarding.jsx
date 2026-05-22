import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../stores/AuthContext";
import { useApp, COLOR_THEMES } from "../stores/AppContext";
import { submitOnboardingComplete } from "../services/ghlService";
import FONT_OPTIONS from "../data/fontOptions";

const SURVEY_STEPS = [
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

const TOTAL_STEPS = SURVEY_STEPS.length + 2; // +2 for reading prefs + theme

const READING_PLANS = {
  searching: { plan: "Gospel of John", book: "John", desc: "Start with the heart of the gospel" },
  new_believer: { plan: "Romans", book: "Romans", desc: "The foundation of Christian doctrine" },
  growing: { plan: "Psalms & Proverbs", book: "Psalms", desc: "Wisdom and worship for daily life" },
  mature: { plan: "Genesis to Revelation", book: "Genesis", desc: "Read through the entire Bible" },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { saveProfile, user, profile } = useAuth();
  const { toggleStudyMode, studyMode, toggleDarkMode, darkMode, setFontFamily, fontFamily, showVerseNumbers, toggleVerseNumbers, colorTheme, setColorTheme } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    faithStage: "",
    goals: [],
    topics: [],
  });

  const isSurveyStep = step < SURVEY_STEPS.length;
  const isReadingPrefsStep = step === SURVEY_STEPS.length;
  const isThemeStep = step === SURVEY_STEPS.length + 1;
  const isLastStep = step === TOTAL_STEPS - 1;

  const currentSurvey = isSurveyStep ? SURVEY_STEPS[step] : null;

  const handleSelect = (value) => {
    if (currentSurvey.multi) {
      setAnswers((prev) => ({
        ...prev,
        [currentSurvey.key]: prev[currentSurvey.key].includes(value)
          ? prev[currentSurvey.key].filter((v) => v !== value)
          : [...prev[currentSurvey.key], value],
      }));
    } else {
      setAnswers((prev) => ({ ...prev, [currentSurvey.key]: value }));
    }
  };

  const isSelected = (value) => {
    if (currentSurvey.multi) {
      return answers[currentSurvey.key].includes(value);
    }
    return answers[currentSurvey.key] === value;
  };

  const canProceed = isSurveyStep
    ? (currentSurvey.multi ? answers[currentSurvey.key].length > 0 : answers[currentSurvey.key] !== "")
    : true; // Reading prefs and theme always allow proceeding

  const handleFinish = () => {
    const plan = READING_PLANS[answers.faithStage] || READING_PLANS.growing;
    const profileData = {
      ...answers,
      readingPlan: plan.plan,
      suggestedBook: plan.book,
    };
    saveProfile(profileData);
    localStorage.setItem("onboardingComplete", "true");

    // Push the survey results to GHL so we can segment by faith stage,
    // goals, and topic interest. Fire-and-forget — never blocks the UI.
    if (user?.email) {
      submitOnboardingComplete({
        email: user.email,
        name: profile?.name || user?.user_metadata?.name || "",
        faithStage: answers.faithStage,
        goals: answers.goals || [],
        topics: answers.topics || [],
        readingPlan: plan.plan,
        suggestedBook: plan.book,
      });
    }

    navigate(`/read/${encodeURIComponent(plan.book)}/1`);
  };

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-8 bg-gold" : i < step ? "w-2 bg-gold/50" : "w-2 bg-cream-dark"
            }`}
          />
        ))}
      </div>

      {/* Survey steps (faith stage, goals, topics) */}
      {isSurveyStep && (
        <>
          <h1 className="text-xl font-bold text-warm-brown text-center mb-8">
            {currentSurvey.title}
          </h1>
          <div className={`grid ${currentSurvey.multi && currentSurvey.options.length > 4 ? "grid-cols-2" : "grid-cols-1"} gap-3 mb-8`}>
            {currentSurvey.options.map((opt) => (
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
        </>
      )}

      {/* Reading Preferences step */}
      {isReadingPrefsStep && (
        <>
          <h1 className="text-xl font-bold text-warm-brown text-center mb-2">
            How would you like to read?
          </h1>
          <p className="text-sm text-warm-brown-light text-center mb-8">
            You can always change this later in Settings.
          </p>

          {/* Read vs Study mode */}
          <div className="mb-6">
            <p className="text-xs font-medium text-warm-brown-light uppercase tracking-wider mb-3">Default Mode</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { if (studyMode) toggleStudyMode(); }}
                className={`px-4 py-4 rounded-xl border-2 transition-colors text-center ${
                  !studyMode ? "border-gold bg-gold/5" : "border-cream-dark bg-white hover:border-gold/30"
                }`}
              >
                <span className={`text-sm font-medium ${!studyMode ? "text-gold" : "text-warm-brown"}`}>
                  Read Mode
                </span>
                <p className="text-[11px] text-warm-brown-light mt-1">Clean, flowing text</p>
              </button>
              <button
                onClick={() => { if (!studyMode) toggleStudyMode(); }}
                className={`px-4 py-4 rounded-xl border-2 transition-colors text-center ${
                  studyMode ? "border-gold bg-gold/5" : "border-cream-dark bg-white hover:border-gold/30"
                }`}
              >
                <span className={`text-sm font-medium ${studyMode ? "text-gold" : "text-warm-brown"}`}>
                  Study Mode
                </span>
                <p className="text-[11px] text-warm-brown-light mt-1">Tap words for definitions</p>
              </button>
            </div>
          </div>

          {/* Verse numbers toggle */}
          <div className="mb-8">
            <p className="text-xs font-medium text-warm-brown-light uppercase tracking-wider mb-3">Verse Numbers</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { if (!showVerseNumbers) toggleVerseNumbers(); }}
                className={`px-4 py-4 rounded-xl border-2 transition-colors text-center ${
                  showVerseNumbers ? "border-gold bg-gold/5" : "border-cream-dark bg-white hover:border-gold/30"
                }`}
              >
                <span className={`text-sm font-medium ${showVerseNumbers ? "text-gold" : "text-warm-brown"}`}>
                  Show Numbers
                </span>
                <p className="text-[11px] text-warm-brown-light mt-1">Traditional verse format</p>
              </button>
              <button
                onClick={() => { if (showVerseNumbers) toggleVerseNumbers(); }}
                className={`px-4 py-4 rounded-xl border-2 transition-colors text-center ${
                  !showVerseNumbers ? "border-gold bg-gold/5" : "border-cream-dark bg-white hover:border-gold/30"
                }`}
              >
                <span className={`text-sm font-medium ${!showVerseNumbers ? "text-gold" : "text-warm-brown"}`}>
                  Hide Numbers
                </span>
                <p className="text-[11px] text-warm-brown-light mt-1">Read like a book</p>
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-scripture-bg rounded-xl p-4 border border-cream-dark">
            <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">Preview</p>
            <p className="font-scripture text-warm-brown leading-relaxed text-base" style={{ fontFamily }}>
              {showVerseNumbers && <sup className="text-[10px] text-gold mr-1 font-sans font-bold">1</sup>}
              In the beginning God created the heaven and the earth.{" "}
              {showVerseNumbers && <sup className="text-[10px] text-gold mr-1 font-sans font-bold">2</sup>}
              And the earth was without form, and void; and darkness was upon the face of the deep.
            </p>
          </div>
        </>
      )}

      {/* Theme & Appearance step */}
      {isThemeStep && (
        <>
          <h1 className="text-xl font-bold text-warm-brown text-center mb-2">
            Choose your look
          </h1>
          <p className="text-sm text-warm-brown-light text-center mb-8">
            You can always change this later in Settings.
          </p>

          {/* Light / Dark */}
          <div className="mb-6">
            <p className="text-xs font-medium text-warm-brown-light uppercase tracking-wider mb-3">Theme</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { if (darkMode) toggleDarkMode(); }}
                className={`px-4 py-4 rounded-xl border-2 transition-colors text-center ${
                  !darkMode ? "border-gold bg-gold/5" : "border-cream-dark bg-white hover:border-gold/30"
                }`}
              >
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-[#faf7f2] border-2 border-[#f0ebe3]" />
                <span className={`text-sm font-medium ${!darkMode ? "text-gold" : "text-warm-brown"}`}>
                  Light
                </span>
              </button>
              <button
                onClick={() => { if (!darkMode) toggleDarkMode(); }}
                className={`px-4 py-4 rounded-xl border-2 transition-colors text-center ${
                  darkMode ? "border-gold bg-gold/5" : "border-cream-dark bg-white hover:border-gold/30"
                }`}
              >
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-[#1a1a1a] border-2 border-[#333]" />
                <span className={`text-sm font-medium ${darkMode ? "text-gold" : "text-warm-brown"}`}>
                  Dark
                </span>
              </button>
            </div>
          </div>

          {/* Color theme */}
          <div className="mb-6">
            <p className="text-xs font-medium text-warm-brown-light uppercase tracking-wider mb-3">Color Scheme</p>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setColorTheme(theme.id)}
                  className={`text-left px-3 py-3 rounded-xl border-2 transition-colors ${
                    colorTheme === theme.id
                      ? "border-gold bg-gold/5"
                      : "border-cream-dark bg-white hover:border-gold/30"
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.gold }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors["warm-brown"] }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.cream }} />
                  </div>
                  <p className={`text-xs font-medium ${colorTheme === theme.id ? "text-gold" : "text-warm-brown"}`}>
                    {theme.name}
                  </p>
                  <p className="text-[10px] text-warm-brown-light">{theme.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Font choice */}
          <div className="mb-8">
            <p className="text-xs font-medium text-warm-brown-light uppercase tracking-wider mb-3">Font Style</p>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setFontFamily(font.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                    fontFamily === font.value
                      ? "border-gold bg-gold/5"
                      : "border-cream-dark bg-white hover:border-gold/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-medium ${fontFamily === font.value ? "text-gold" : "text-warm-brown"}`}>
                      {font.label}
                    </p>
                    {font.desc && (
                      <p className="text-[10px] text-warm-brown-light/70">{font.desc}</p>
                    )}
                  </div>
                  <p className="text-sm text-warm-brown-light" style={{ fontFamily: font.value }}>
                    {font.sample}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-warm-brown-light hover:text-warm-brown"
            >
              Back
            </button>
          )}
          <button
            onClick={() => { localStorage.setItem("onboardingComplete", "true"); navigate("/"); }}
            className="text-sm text-warm-brown-light/60 hover:text-warm-brown-light"
          >
            Skip
          </button>
        </div>
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
