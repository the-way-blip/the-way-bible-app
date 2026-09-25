import fs from "fs";
const [SC, REPO] = process.argv.slice(2);
const { usfm, counts } = JSON.parse(fs.readFileSync(`${SC}/sword/kjv-meta.json`, "utf8"));
const IDS = { Bishops: "bishops", Coverdale: "coverdale", Great: "great", Matthew: "matthew" };
const cov = JSON.parse(fs.readFileSync(`${REPO}/src/data/commentaryCoverage.json`, "utf8"));
for (const [ver, id] of Object.entries(IDS)) {
  const dir = `${REPO}/public/data/bibles/${id}`; fs.mkdirSync(dir, { recursive: true });
  let verses = 0, missingCh = 0, emptyV = 0; const books = [];
  for (const [book, chs] of Object.entries(counts)) {
    const u = usfm[book]; const out = {};
    for (const [ch, last] of Object.entries(chs)) {
      const f = `${SC}/sb/raw/${ver}/${u}/${ch}.json`;
      if (!fs.existsSync(f)) { missingCh++; continue; }
      const raw = JSON.parse(fs.readFileSync(f, "utf8"));
      const arr = Array.from({ length: last }, (_, i) => (raw[i + 1] || "").replace(/\s*\(\d+:\d+[a-z]?\)\s*/g, " ").trim());
      emptyV += arr.filter((t) => !t).length; verses += arr.filter(Boolean).length;
      if (arr.some(Boolean)) out[ch] = arr;
    }
    if (Object.keys(out).length) { fs.writeFileSync(`${dir}/${u}.json`, JSON.stringify(out)); books.push(u); }
  }
  cov.bibles[id] = books;
  console.log(`${id}: ${books.length} books, ${verses} verses, ${missingCh} chapters missing, ${emptyV} empty verse slots`);
}
fs.writeFileSync(`${REPO}/src/data/commentaryCoverage.json`, JSON.stringify(cov));
