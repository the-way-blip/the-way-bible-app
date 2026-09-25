#!/usr/bin/env node
// People profiles + Bible timeline from the Theographic Bible Metadata
// (github.com/robertrouse/theographic-bible-metadata, CC BY-SA 4.0).
//   node scripts/build-people-timeline.mjs <folder with people/events/verses/places/peopleGroups/books .json>
// → public/data/people/index.json, public/data/people/<A-Z>.json, public/data/timeline.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SRC = process.argv[2];
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "data");
const load = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f + ".json"), "utf8"));
const [people, events, verses, places, groups] = ["people", "events", "verses", "places", "peopleGroups"].map(load);

const OSIS = Object.fromEntries("Gen Genesis|Exod Exodus|Lev Leviticus|Num Numbers|Deut Deuteronomy|Josh Joshua|Judg Judges|Ruth Ruth|1Sam 1 Samuel|2Sam 2 Samuel|1Kgs 1 Kings|2Kgs 2 Kings|1Chr 1 Chronicles|2Chr 2 Chronicles|Ezra Ezra|Neh Nehemiah|Esth Esther|Job Job|Ps Psalms|Prov Proverbs|Eccl Ecclesiastes|Song Song of Solomon|Isa Isaiah|Jer Jeremiah|Lam Lamentations|Ezek Ezekiel|Dan Daniel|Hos Hosea|Joel Joel|Amos Amos|Obad Obadiah|Jonah Jonah|Mic Micah|Nah Nahum|Hab Habakkuk|Zeph Zephaniah|Hag Haggai|Zech Zechariah|Mal Malachi|Matt Matthew|Mark Mark|Luke Luke|John John|Acts Acts|Rom Romans|1Cor 1 Corinthians|2Cor 2 Corinthians|Gal Galatians|Eph Ephesians|Phil Philippians|Col Colossians|1Thess 1 Thessalonians|2Thess 2 Thessalonians|1Tim 1 Timothy|2Tim 2 Timothy|Titus Titus|Phlm Philemon|Heb Hebrews|Jas James|1Pet 1 Peter|2Pet 2 Peter|1John 1 John|2John 2 John|3John 3 John|Jude Jude|Rev Revelation".split("|").map((s) => { const i = s.indexOf(" "); return [s.slice(0, i), s.slice(i + 1)]; }));
const verseById = new Map(verses.map((v) => [v.id, v.fields.osisRef]));
const readable = (osis) => { const [b, c, v] = osis.split("."); return `${OSIS[b]} ${c}:${v}`; };
const personById = new Map(people.map((p) => [p.id, p.fields]));
const placeById = new Map(places.map((p) => [p.id, p.fields.displayTitle || p.fields.kjvName]));
const groupById = new Map(groups.map((g) => [g.id, g.fields.groupName || g.fields.name]));

// Label: the curated displayTitle ("Jesus Christ", "Joseph (of Arimathea)"); when two people
// still share one, add the father or the first book they appear in.
const titleCount = {};
for (const p of people) { const t = p.fields.displayTitle || p.fields.name; titleCount[t] = (titleCount[t] || 0) + 1; }
function label(f) {
  const t = f.displayTitle || f.name;
  if (titleCount[t] <= 1 || /\(/.test(t)) return t;
  const father = (f.father || []).map((id) => personById.get(id)?.name).find(Boolean);
  if (father) return `${t} (${f.gender === "Female" ? "daughter" : "son"} of ${father})`;
  const first = (f.verses || []).map((id) => verseById.get(id)).find(Boolean);
  return first ? `${t} (${OSIS[first.split(".")[0]]})` : t;
}
const link = (ids) => (ids || []).map((id) => personById.get(id)).filter(Boolean).map((f) => [f.slug, label(f)]);
const year = (y) => (y === undefined || y === null || y === "" ? null : parseInt(y, 10));

// Events first so people can list theirs
const evSorted = events.map((e) => e.fields).sort((a, b) => a.sortKey - b.sortKey);
const eventsByPerson = {};
const timeline = evSorted.map((e) => {
  const refs = (e.verses || []).map((id) => verseById.get(id)).filter(Boolean);
  const who = link(e.participants).slice(0, 8);
  for (const [slug] of link(e.participants)) (eventsByPerson[slug] ||= []).push(e.eventID);
  return {
    id: e.eventID, year: year(e.startDate), title: e.title, duration: e.duration || null,
    ref: refs[0] ? readable(refs[0]) : null, refCount: refs.length,
    people: who, places: (e.locations || []).map((id) => placeById.get(id)).filter(Boolean).slice(0, 4),
  };
});
fs.writeFileSync(path.join(OUT, "timeline.json"), JSON.stringify(timeline));

// People
const dir = path.join(OUT, "people");
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const index = [], chunks = {};
for (const { fields: f } of people) {
  const refs = (f.verses || []).map((id) => verseById.get(id)).filter(Boolean);
  const books = {};
  for (const r of refs) { const b = OSIS[r.split(".")[0]]; books[b] = (books[b] || 0) + 1; }
  const rec = {
    slug: f.slug, name: f.name, label: label(f), gender: f.gender,
    alsoCalled: [...new Map(String(f.alsoCalled || "").split(/,\s*/).filter((n) => /^[A-Z][a-z]/.test(n)).map((n) => [n.toLowerCase(), n])).values()].slice(0, 10),
    born: year(f.birthYear), died: year(f.deathYear),
    firstYear: year(f.minYear), lastYear: year(f.maxYear),
    bornAt: (f.birthPlace || []).map((id) => placeById.get(id)).filter(Boolean)[0] || null,
    diedAt: (f.deathPlace || []).map((id) => placeById.get(id)).filter(Boolean)[0] || null,
    verseCount: refs.length,
    keyRefs: refs.slice(0, 1).concat(refs.length > 1 ? refs.filter((_, i) => i % Math.max(1, Math.floor(refs.length / 8)) === 0).slice(1, 8) : []).map(readable),
    books: Object.entries(books).sort((a, b) => b[1] - a[1]).slice(0, 8),
    father: link(f.father), mother: link(f.mother), spouses: link(f.partners),
    siblings: link([...(f.siblings || []), ...(f.halfSiblingsSameFather || []), ...(f.halfSiblingsSameMother || [])]),
    children: link(f.children),
    groups: (f.memberOf || []).map((id) => groupById.get(id)).filter(Boolean),
    events: eventsByPerson[f.slug] || [],
  };
  index.push([rec.slug, rec.label, rec.verseCount, rec.gender[0]]);
  const letter = (rec.slug.match(/[a-z]/)?.[0] || "_").toUpperCase();   // app finds a person by slug
  (chunks[letter] ||= {})[rec.slug] = rec;
}
index.sort((a, b) => b[2] - a[2]);
fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(index));
for (const [l, data] of Object.entries(chunks)) fs.writeFileSync(path.join(dir, `${l}.json`), JSON.stringify(data));
console.log(`people: ${index.length} (${Object.keys(chunks).length} files) · timeline: ${timeline.length} events`);
