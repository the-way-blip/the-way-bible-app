// SM-2 algorithm (same as Anki)
// quality: 0-5 (0=complete blackout, 5=perfect response)
// Mapped from UI: Again=1, Hard=2, Good=3, Easy=5

export function sm2(verse, quality) {
  let { interval, easeFactor, repetitions } = verse;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  let status = "learning";
  if (repetitions >= 3 && interval >= 21) {
    status = "mastered";
  } else if (repetitions >= 1) {
    status = "reviewing";
  }

  return {
    ...verse,
    interval,
    easeFactor,
    repetitions,
    nextReview,
    status,
    practiceCount: (verse.practiceCount || 0) + 1,
  };
}

export function getDueVerses(verses) {
  const now = Date.now();
  return verses.filter((v) => v.nextReview <= now);
}
