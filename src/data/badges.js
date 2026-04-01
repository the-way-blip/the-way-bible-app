// Progress badges — unlocked based on reading milestones
const badges = [
  { id: "first_chapter", name: "First Steps", desc: "Read your first chapter", icon: "🌱", condition: (p) => getTotalChapters(p) >= 1 },
  { id: "week_streak", name: "Faithful Week", desc: "7-day reading streak", icon: "🔥", condition: (p) => (p.streak || 0) >= 7 },
  { id: "ten_chapters", name: "Digging In", desc: "Read 10 chapters", icon: "📖", condition: (p) => getTotalChapters(p) >= 10 },
  { id: "month_streak", name: "Steadfast", desc: "30-day reading streak", icon: "⭐", condition: (p) => (p.streak || 0) >= 30 },
  { id: "fifty_chapters", name: "Scholar", desc: "Read 50 chapters", icon: "🎓", condition: (p) => getTotalChapters(p) >= 50 },
  { id: "whole_book", name: "Completionist", desc: "Finish an entire book", icon: "✅", condition: (p) => hasFinishedABook(p) },
  { id: "five_memory", name: "Hidden in Heart", desc: "Save 5 memory verses", icon: "💎", condition: (_, m) => m >= 5 },
  { id: "hundred_chapters", name: "Devoted", desc: "Read 100 chapters", icon: "🏆", condition: (p) => getTotalChapters(p) >= 100 },
  { id: "year_streak", name: "Pillar of Faith", desc: "365-day reading streak", icon: "👑", condition: (p) => (p.streak || 0) >= 365 },
  { id: "full_nt", name: "New Testament", desc: "Read all 260 NT chapters", icon: "📜", condition: (p) => getNTChapters(p) >= 260 },
  { id: "full_bible", name: "Whole Counsel", desc: "Read all 1,189 chapters", icon: "🏅", condition: (p) => getTotalChapters(p) >= 1189 },
];

import bibleBooks from "./bibleBooks";

function getTotalChapters(p) {
  if (!p.completedChapters) return 0;
  return Object.values(p.completedChapters).reduce((sum, chs) => sum + chs.length, 0);
}

function getNTChapters(p) {
  if (!p.completedChapters) return 0;
  const ntBooks = bibleBooks.filter((b) => b.testament === "NT").map((b) => b.name);
  return ntBooks.reduce((sum, name) => sum + (p.completedChapters[name]?.length || 0), 0);
}

function hasFinishedABook(p) {
  if (!p.completedChapters) return false;
  return bibleBooks.some(
    (b) => (p.completedChapters[b.name]?.length || 0) >= b.chapters
  );
}

export function getUnlockedBadges(progress, memoryVerseCount = 0) {
  return badges.filter((b) => b.condition(progress, memoryVerseCount));
}

export function getNextBadge(progress, memoryVerseCount = 0) {
  return badges.find((b) => !b.condition(progress, memoryVerseCount));
}

export default badges;
