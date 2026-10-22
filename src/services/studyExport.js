// Turn a reader's notes and highlights into a readable study document:
// verses in canonical order with the KJV text, highlight colour and notes.
// Used by Settings and the reader's Aa menu (scoped to one book).
import { Capacitor } from "@capacitor/core";
import { dbGetAll } from "../hooks/useDB";
import BIBLE_BOOKS from "../data/bibleBooks";
import { USFM_BOOK_IDS } from "../data/translations";

const ORDER = new Map(BIBLE_BOOKS.map((b, i) => [b.name, i]));
const COLORS = { yellow: "#fde68a", green: "#bbf7d0", blue: "#bfdbfe", pink: "#fbcfe8", purple: "#e9d5ff", orange: "#fed7aa" };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const bookCache = new Map();
async function kjvChapter(book, chapter) {
  const usfm = USFM_BOOK_IDS[book];
  if (!usfm) return null;
  if (!bookCache.has(usfm)) bookCache.set(usfm, fetch(`/data/bibles/kjv/${usfm}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return (await bookCache.get(usfm))?.[String(chapter)] || null;
}

/** Books (canonical order) that have at least one note or highlight. */
export async function booksWithStudy() {
  const [notes, highlights] = await Promise.all([dbGetAll("notes"), dbGetAll("highlights")]);
  const set = new Set([...notes, ...highlights].map((x) => x.book).filter(Boolean));
  return [...set].sort((a, b) => (ORDER.get(a) ?? 99) - (ORDER.get(b) ?? 99));
}

/** { title, html, text, count } for one book, or every book when `book` is null. */
export async function buildStudyDoc(book = null) {
  const [notes, highlights] = await Promise.all([dbGetAll("notes"), dbGetAll("highlights")]);
  const verses = new Map(); // "Book|ch|v" → { book, chapter, verse, notes: [], color }
  const key = (b, c, v) => `${b}|${c}|${v}`;
  const at = (b, c, v) => {
    const k = key(b, c, v);
    if (!verses.has(k)) verses.set(k, { book: b, chapter: Number(c), verse: Number(v), notes: [], color: null });
    return verses.get(k);
  };
  for (const n of notes) if (n.text?.trim() && (!book || n.book === book)) at(n.book, n.chapter, n.verseNumber ?? n.verse).notes.push(n);
  for (const h of highlights) if (!book || h.book === book) at(h.book, h.chapter, h.verseNumber ?? h.verse).color = h.color;

  const list = [...verses.values()].sort((a, b) =>
    (ORDER.get(a.book) ?? 99) - (ORDER.get(b.book) ?? 99) || a.chapter - b.chapter || a.verse - b.verse);
  for (const v of list) v.text = (await kjvChapter(v.book, v.chapter))?.[v.verse - 1] || "";

  const title = book ? `${book}: my study notes` : "My study notes";
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  let html = "", text = `${title}\nTheWay Bible App · King James Version · ${date}\n`;
  let lastBook = null, lastChapter = null;
  for (const v of list) {
    if (v.book !== lastBook) { html += `<h2>${esc(v.book)}</h2>`; text += `\n\n${v.book.toUpperCase()}\n`; lastBook = v.book; lastChapter = null; }
    if (v.chapter !== lastChapter) { html += `<h3>Chapter ${v.chapter}</h3>`; text += `\nChapter ${v.chapter}\n`; lastChapter = v.chapter; }
    const bg = v.color ? ` style="background:${COLORS[v.color] || "#fde68a"}"` : "";
    html += `<div class="v"><p class="t"><span class="r">${esc(v.book)} ${v.chapter}:${v.verse}</span> <mark${bg}>${esc(v.text)}</mark></p>`;
    text += `\n${v.book} ${v.chapter}:${v.verse}  ${v.text}\n`;
    for (const n of v.notes) {
      const tags = n.tags?.length ? ` <span class="tags">${n.tags.map((t) => `#${esc(t)}`).join(" ")}</span>` : "";
      html += `<p class="n">${esc(n.text).replace(/\n/g, "<br>")}${tags}</p>`;
      text += `   Note: ${n.text}${n.tags?.length ? `  ${n.tags.map((t) => `#${t}`).join(" ")}` : ""}\n`;
    }
    html += "</div>";
  }
  if (!list.length) html = `<p class="empty">No notes or highlights yet${book ? ` in ${esc(book)}` : ""}.</p>`;

  const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font:16px/1.6 Georgia,"Times New Roman",serif;color:#2b2118;max-width:44rem;margin:2rem auto;padding:0 1.25rem}
h1{font-size:1.6rem;margin:0}.meta{color:#806252;font:13px system-ui,sans-serif;margin:.25rem 0 1.5rem}
h2{font-size:1.3rem;border-bottom:1px solid #e5dccf;padding-bottom:.25rem;margin-top:2rem}h3{font:600 12px system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em;color:#a07f3c;margin:1.25rem 0 .5rem}
.v{margin:0 0 1rem;break-inside:avoid}.t{margin:0}.r{font:700 12px system-ui,sans-serif;color:#806252}mark{background:none;color:inherit;padding:0 .1em}
.n{margin:.35rem 0 0 1rem;padding-left:.75rem;border-left:3px solid #c9a84c;font:15px/1.55 system-ui,sans-serif}.tags{color:#a07f3c;font-size:12px}
.empty{color:#806252}@media print{body{margin:0}a{color:inherit}}</style></head>
<body><h1>${esc(title)}</h1><p class="meta">TheWay Bible App · King James Version · ${esc(date)} · ${list.length} verse${list.length === 1 ? "" : "s"}</p>${html}</body></html>`;
  return { title, html: page, text, count: list.length };
}

/** Print / save as PDF (web): print the document from a hidden frame. */
export function printDoc(html) {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  frame.srcdoc = html;
  frame.onload = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 60000);
  };
}

/** Hand a file to the user: the share sheet in the iOS app or on phones, a download elsewhere. */
export async function saveFile(filename, content, mime) {
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
    const { uri } = await Filesystem.writeFile({ path: filename, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: filename, files: [uri] }).catch(() => {});
    return;
  }
  const file = new File([content], filename, { type: mime });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
