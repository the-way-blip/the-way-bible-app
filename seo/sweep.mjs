import { render, books } from "./render.js";
import { TOPICS } from "./topics.js";
let n = 0, bad = 0, bytes = 0; const t0 = Date.now();
const check = (q, p) => { try { const o = render(q); n++; bytes += o.body.length; if (o.status !== 200) { bad++; console.log("NON-200", p, o.status); } if (o.status===200 && !/<title>/.test(o.body) && !/<\?xml/.test(o.body)) { bad++; console.log("NO TITLE", p); } } catch (e) { bad++; console.log("THROW", p, e.message); } };
check({kind:"bible"},"/bible"); check({kind:"topics"},"/verses-about"); check({kind:"sitemap-index"},"/sitemap.xml"); check({kind:"sitemap",file:"pages"},"/sitemaps/pages.xml");
for (const t of TOPICS) check({kind:"topic",topic:t.slug},"/verses-about/"+t.slug);
for (const b of books()) { check({kind:"book",book:b.slug},"/bible/"+b.slug); check({kind:"sitemap",file:"verses-"+b.slug},"sitemap "+b.slug);
  b.chapters.forEach((ch,ci)=>{ check({kind:"chapter",book:b.slug,chapter:String(ci+1)},`/bible/${b.slug}/${ci+1}`); ch.forEach((_,vi)=>check({kind:"verse",book:b.slug,chapter:String(ci+1),verse:String(vi+1)},`/bible/${b.slug}/${ci+1}/${vi+1}`)); }); }
console.log(`rendered ${n} pages, ${bad} problems, ${(bytes/1e6).toFixed(0)} MB total, ${((Date.now()-t0)/1000).toFixed(1)}s`);
