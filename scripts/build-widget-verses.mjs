#!/usr/bin/env node
// Regenerate ios/App/TheWayWidget/DailyVerses.swift from src/data/dailyVerses.js
// (run after editing the verse pool, then rebuild the iOS app).
import fs from "fs";
import V from "../src/data/dailyVerses.js";
const q = (s) => JSON.stringify(s);
const rows = V.map((v) => `    DailyVerse(ref: ${q(v.ref)}, book: ${q(v.book)}, chapter: ${v.chapter}, verse: ${v.verse}, text: ${q(v.text)})`).join(",\n");
fs.writeFileSync(new URL("../ios/App/TheWayWidget/DailyVerses.swift", import.meta.url), `// Generated from src/data/dailyVerses.js by scripts/build-widget-verses.mjs — do not edit by hand.
// The widget rotates through the same pool as the app (day of year mod count).
struct DailyVerse { let ref: String; let book: String; let chapter: Int; let verse: Int; let text: String }

let dailyVerses: [DailyVerse] = [
${rows}
]
`);
console.log(`${V.length} verses`);
