// Full reading plan data with actual daily chapter assignments
import bibleBooks from "./bibleBooks";

// Generate a "whole Bible in a year" plan
function generateWholeBiblePlan() {
  const days = [];
  let dayNum = 0;
  for (const book of bibleBooks) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      const dayIndex = Math.floor(dayNum / 3); // ~3 chapters per day
      if (!days[dayIndex]) days[dayIndex] = [];
      days[dayIndex].push({ book: book.name, chapter: ch });
      dayNum++;
    }
  }
  return days;
}

// Generate NT-only plan
function generateNTPlan() {
  const days = [];
  let dayNum = 0;
  const ntBooks = bibleBooks.filter((b) => b.testament === "NT");
  for (const book of ntBooks) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      const dayIndex = Math.floor(dayNum / 3);
      if (!days[dayIndex]) days[dayIndex] = [];
      days[dayIndex].push({ book: book.name, chapter: ch });
      dayNum++;
    }
  }
  return days;
}

// Generate plan for specific books
function generateBookPlan(bookNames, chaptersPerDay = 1) {
  const days = [];
  let dayNum = 0;
  for (const name of bookNames) {
    const book = bibleBooks.find((b) => b.name === name);
    if (!book) continue;
    for (let ch = 1; ch <= book.chapters; ch++) {
      const dayIndex = Math.floor(dayNum / chaptersPerDay);
      if (!days[dayIndex]) days[dayIndex] = [];
      days[dayIndex].push({ book: book.name, chapter: ch });
      dayNum++;
    }
  }
  return days;
}

export const PLANS = [
  {
    id: "whole-bible",
    name: "Read the Bible in a Year",
    desc: "3-4 chapters per day, Genesis to Revelation",
    getDays: generateWholeBiblePlan,
  },
  {
    id: "new-testament",
    name: "New Testament in 90 Days",
    desc: "The Gospels through Revelation",
    getDays: generateNTPlan,
  },
  {
    id: "psalms-proverbs",
    name: "Psalms & Proverbs",
    desc: "Wisdom and worship daily",
    getDays: () => generateBookPlan(["Psalms", "Proverbs"], 3),
  },
  {
    id: "gospels",
    name: "The Four Gospels",
    desc: "Walk with Jesus through Matthew, Mark, Luke, John",
    getDays: () => generateBookPlan(["Matthew", "Mark", "Luke", "John"], 3),
  },
  {
    id: "romans-deep",
    name: "Romans Deep Dive",
    desc: "One chapter per day through Paul's masterwork",
    getDays: () => generateBookPlan(["Romans"], 1),
  },
];

export function getPlanById(id) {
  return PLANS.find((p) => p.id === id);
}

export function getTodaysReading(planId, startDate) {
  const plan = getPlanById(planId);
  if (!plan) return null;

  const days = plan.getDays();
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const dayIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (dayIndex < 0 || dayIndex >= days.length) return null;

  return {
    day: dayIndex + 1,
    totalDays: days.length,
    readings: days[dayIndex],
  };
}
