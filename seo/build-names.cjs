// Regenerates seo/names.js from seo/names.tsv plus the Strong's data in
// public/data/strongs. Run from the repo root: node seo/build-names.cjs
const fs=require("fs");
const H=JSON.parse(fs.readFileSync("public/data/strongs/hebrew.json","utf8"));
const G=JSON.parse(fs.readFileSync("public/data/strongs/greek.json","utf8"));
const rows=fs.readFileSync(__dirname+"/names.tsv","utf8").trim().split("\n").map(l=>l.split("\t"));
const out=[]; const bad=[];
for(const row of rows){
  let [name,sex,strongs,meaning,topic,note]=row;
  // "Keziah|Kezia": the name as people spell it today, then the KJV's spelling,
  // which is what the occurrence scan has to match against the text.
  let kjv=null;
  if(name.includes("|")) [name,kjv]=name.split("|");
  const e=(strongs[0]==="H"?H:G)[strongs];
  if(!e){bad.push(name+" bad strongs "+strongs);continue;}
  const o={ name, sex, strongs,
    lang: strongs[0]==="H"?"Hebrew":"Greek",
    lemma: e.lemma||"", xlit: (e.xlit||e.translit||""), pron: e.pron||"",
    meaning,
    source: (e.derivation||"").replace(/\s+/g," ").replace(/^[;,\s]+|[;,\s]+$/g,""),
    gloss: (e.strongs_def||"").replace(/\s+/g," ").trim(),
    note };
  // A few Greek names carry a derivation that does not explain the name:
  // Strong's traces Matthew to a word meaning "to fight", while its own gloss
  // says "(i.e. Matthitjah)" — the Hebrew Mattithyah, H4993, "gift of Jah".
  // Cite the Hebrew so the source line agrees with the meaning shown.
  const VIA={ Matthew: "H4993" };
  if(VIA[name]){
    const v=(VIA[name][0]==="H"?H:G)[VIA[name]];
    o.source="Greek form of the Hebrew "+(v.xlit||"")+" ("+VIA[name]+"): "+(v.derivation||"").replace(/\s+/g," ").replace(/^[;,\s]+|[;,\s]+$/g,"");
  }
  if(kjv) o.kjv=kjv;
  if(topic&&topic!=="\\N") o.topic=topic;
  out.push(o);
}
if(bad.length){console.error("PROBLEMS:\n"+bad.join("\n"));process.exit(1);}
out.sort((a,b)=>a.name.localeCompare(b.name));
const esc=(s)=>JSON.stringify(s);
const body=out.map(o=>"  { name: "+esc(o.name)+", sex: "+esc(o.sex)+", strongs: "+esc(o.strongs)+", lang: "+esc(o.lang)
  +",\n    lemma: "+esc(o.lemma)+", xlit: "+esc(o.xlit)+", pron: "+esc(o.pron)
  +",\n    meaning: "+esc(o.meaning)+(o.kjv?", kjv: "+esc(o.kjv):"")+(o.topic?", topic: "+esc(o.topic):"")
  +",\n    source: "+esc(o.source)+",\n    gloss: "+esc(o.gloss)+",\n    note: "+esc(o.note)+" }").join(",\n");
const header=`/**
 * seo/names.js — biblical names for /bible-names.
 *
 * Different intent from the /verses-about/ person pages: those tell the
 * story, these answer "what does this name mean". Each page links to the
 * other where both exist.
 *
 * lemma, xlit, pron, source and gloss are copied verbatim from the Strong's
 * data already shipped in public/data/strongs (public domain) by
 * seo/build-names.cjs — they are not written by hand. \`meaning\` is the
 * plain-English rendering, checked against \`source\` one name at a time;
 * where Strong's calls a derivation uncertain, the meaning says so rather
 * than inventing one. Every page shows \`source\` so a reader can check it.
 */
export const NAMES = [
`;
fs.writeFileSync("seo/names.js", header+body+",\n];\n");
console.log("wrote",out.length,"names |",out.filter(o=>o.sex==="boy").length,"boy,",out.filter(o=>o.sex==="girl").length,"girl |",out.filter(o=>o.topic).length,"linked to a person page");
