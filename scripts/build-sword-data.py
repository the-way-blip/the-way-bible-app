#!/usr/bin/env python3
"""
Converts CrossWire SWORD modules into static JSON the app loads directly.

  Bibles       → public/data/bibles/<id>/<USFM>.json      { "<ch>": ["v1 text", "v2 text", ...] }
  Commentaries → public/data/commentary/<id>/<USFM>.json  { "<ch>": [["16", "text"], ["17-18", "text"], ...] }

Setup (one time):
  python3 -m venv .sword-venv && .sword-venv/bin/pip install pysword
  Download module zips from https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/<Name>.zip
  and unzip them all into one folder, then:
  .sword-venv/bin/python scripts/build-sword-data.py <unzipped-folder> <kjv-meta.json>

kjv-meta.json = { usfm: {Book: "USFM"}, counts: {Book: {ch: lastVerse}} } (dumped from the app's data).
"""
import html, json, os, re, sys
from pysword.bible import SwordBible
from pysword.modules import BlockType

SRC, META = sys.argv[1], sys.argv[2]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "data")
meta = json.load(open(META))
USFM, COUNTS = meta["usfm"], meta["counts"]

def app_name(name):
    n = re.sub(r"^III ", "3 ", re.sub(r"^II ", "2 ", re.sub(r"^I ", "1 ", name)))
    return {"Revelation of John": "Revelation", "Song of Songs": "Song of Solomon"}.get(n, n)

# ── markup → plain text with paragraph breaks ──────────────────────────────
def clean(raw, source):
    t = raw
    if source == "GBF":
        t = re.sub(r"<RF>.*?<Rf>", "", t, flags=re.S)
        t = re.sub(r"<FU>#?(.*?)\|?<Fu>", r"\1", t)
        t = t.replace("<CM>", "\n\n").replace("<CL>", "\n")
        t = re.sub(r"<[A-Z][A-Za-z0-9]*[^>]*>", "", t)
        t = re.sub(r"[ \t]*\n[ \t]*(?!\n)", " ", t)          # GBF hard-wraps lines
    else:
        t = re.sub(r"<note[^>]*>.*?</note>", "", t, flags=re.S)
        t = re.sub(r"<title[^>]*>(.*?)</title>", r"\n\n\1\n\n", t, flags=re.S)
        t = re.sub(r"<(div|milestone)[^>]*type=\"x-p\"[^>]*/>", "\n\n", t)
        t = re.sub(r"<lb[^>]*/>|<br\s*/?>", "\n", t, flags=re.I)
        t = re.sub(r"</?p[^>]*>", "\n\n", t, flags=re.I)
        t = re.sub(r"<[^>]+>", "", t)
    t = t.replace("\r", "")
    t = html.unescape(t).replace(" ", " ")
    # A few source bytes are corrupted in Barnes; repair the common cases, drop the rest
    t = re.sub(r"\bo\ufffd\b", "of", t)
    t = t.replace("\ufffdrom", "from").replace("\ufffdhe ", "the ")
    t = re.sub(r"\ufffd(?=\d)", "\u00a3", t).replace("\ufffd", "")
    t = t.replace("&c;", "&c.")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r" *\n *", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()

def open_module(path, mod_type, v11n, source, block, encoding="utf-8"):
    # Modules without an Encoding= line in their .conf are Latin-1 per the SWORD spec
    kw = dict(module_type=mod_type, versification=v11n, encoding=encoding, source_type=source)
    if block: kw["block_type"] = block
    return SwordBible(os.path.join(SRC, "modules", path), **kw)

def books_of(bible):
    return [b for t in bible.get_structure().get_books().values() for b in t]

def safe_get(bible, name, ch, vs):
    try:
        return bible.get(books=[name], chapters=[ch], verses=[vs], clean=False)
    except Exception:
        return ""

CHUNK_BYTES = 1_000_000  # books bigger than this are split into <USFM>/<ch>.json

def write(kind, mod_id, usfm, data):
    import shutil
    d = os.path.join(OUT, kind, mod_id); os.makedirs(d, exist_ok=True)
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    book_file, chunk_dir = os.path.join(d, f"{usfm}.json"), os.path.join(d, usfm)
    if os.path.isdir(chunk_dir): shutil.rmtree(chunk_dir)
    if kind == "commentary" and len(body.encode()) > CHUNK_BYTES:
        if os.path.exists(book_file): os.remove(book_file)
        os.makedirs(chunk_dir)
        for ch, entries in data.items():
            with open(os.path.join(chunk_dir, f"{ch}.json"), "w") as f:
                json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))
        return
    with open(book_file, "w") as f:
        f.write(body)

# ── Vulgate → KJV numbering (Wycliffe) ──────────────────────────────────────
# KJV psalm → list of (vulgate psalm, part) sources. Split/merged psalms are
# approximated by verse ranges; everything else is a one-for-one renumbering.
def vulg_psalm_for(kjv):
    if kjv <= 8 or kjv >= 148: return kjv
    if kjv in (9, 10): return 9
    if 11 <= kjv <= 113: return kjv - 1
    if kjv in (114, 115): return 113
    if kjv == 116: return (114, 115)
    if 117 <= kjv <= 146: return kjv - 1
    if kjv == 147: return (146, 147)

def build_bible(mod_id, path, mod_type, v11n, source, block):
    bible = open_module(path, mod_type, v11n, source, block)
    names = {app_name(b.name): b for b in books_of(bible)}
    total = 0
    for book, usfm in USFM.items():
        if book not in COUNTS or book not in names: continue
        b = names[book]
        chapters = {}
        for ch_s, last in COUNTS[book].items():
            ch = int(ch_s)
            if v11n == "vulg" and book == "Psalms":
                src = vulg_psalm_for(ch)
                srcs = src if isinstance(src, tuple) else (src,)
                verses = []
                for s in srcs:
                    n = b.chapter_lengths[s - 1] if s <= b.num_chapters else 0
                    verses += [clean(safe_get(bible, b.name, s, v), source) for v in range(1, n + 1)]
                if ch == 10: verses = verses[len(verses) - last:]          # second half of Vg 9
                elif ch == 9: verses = verses[: max(0, len(verses) - COUNTS[book]["10"])]
                elif ch == 115: verses = verses[len(verses) - last:]
                elif ch == 114: verses = verses[: max(0, len(verses) - COUNTS[book]["115"])]
                # Psalm titles take extra leading verse numbers in the Vulgate: drop the surplus
                if len(verses) > last: verses = verses[len(verses) - last:]
            else:
                if ch > b.num_chapters: continue
                n = b.chapter_lengths[ch - 1]
                verses = [clean(safe_get(bible, b.name, ch, v), source) for v in range(1, n + 1)]
                if len(verses) > last:                         # extra verses (e.g. Vg Mal 3:19-24) spill over
                    verses = verses[:last]
            if not any(verses): continue
            chapters[ch_s] = verses[:last] + [""] * max(0, last - len(verses))
            total += sum(1 for v in chapters[ch_s] if v)
        if chapters: write("bibles", mod_id, usfm, chapters)
    print(f"bible {mod_id}: {total} verses")


# Spurgeon's Treasury of David stores each psalm as one entry at verse 1 with
# "Verse N." headings inside three sections. Split it into an overview entry
# plus one entry per verse (or verse group) that gathers all three sections.
SPURGEON_SECTIONS = [("EXPOSITION", "Exposition"),
                     ("EXPLANATORY NOTES AND QUAINT SAYINGS", "Notes and quaint sayings"),
                     ("HINTS TO THE VILLAGE PREACHER", "Hints to the village preacher")]
VERSE_HEAD = re.compile(r"^(Verses? (\d+)(?:\s*(?:-|to)\s*(\d+))?(?:[\d,\s\-and]*)\.)", re.M)

P119_MARK = re.compile(r"^Psalms 119:(\d+)\*$", re.M)
P119_LABELS = {"EXPOSITION.": "Exposition", "EXPLANATORY NOTES AND QUAINT SAYINGS.": "Notes and quaint sayings",
               "HINTS TO PREACHERS.": "Hints to preachers", "HINTS TO THE PREACHERS.": "Hints to preachers",
               "HINTS TO THE VILLAGE PREACHER.": "Hints to the village preacher"}

def split_psalm_119(text):
    # Psalm 119 is laid out verse by verse, each block introduced by "Psalms 119:N*"
    marks = list(P119_MARK.finditer(text))
    if not marks: return [["intro", text]]
    # Verse 1 has no marker of its own: it starts at its first "Ver. 1." line
    v1 = re.search(r"^(EXPOSITION\.\n+)?Ver(se)?\. 1\b", text[: marks[0].start()], re.M)
    first = v1.start() if v1 else marks[0].start()
    entries = [["intro", text[:first].strip()]]
    bounds = [(1, first)] + [(int(m.group(1)), m.end()) for m in marks]
    for i, (verse, start) in enumerate(bounds):
        end = marks[i].start() if i < len(marks) else len(text)
        body = re.split(r"^WORKS? UPON THE ", text[start:end], maxsplit=1, flags=re.M)[0].strip()
        for raw, label in P119_LABELS.items():
            body = re.sub(r"^" + re.escape(raw) + r"$", label, body, flags=re.M)
        if body: entries.append([str(verse), body])
    return entries

def split_spurgeon(text):
    if P119_MARK.search(text): return split_psalm_119(text)
    positions = []
    for marker, label in SPURGEON_SECTIONS:
        m = re.search(r"^" + re.escape(marker) + r"$", text, re.M)
        if m: positions.append((m.start(), m.end(), label))
    if not positions: return [["intro", text]]
    positions.sort()
    overview = text[: positions[0][0]].strip()
    by_verse = {}
    order = []
    for i, (start, end, label) in enumerate(positions):
        body = text[end: positions[i + 1][0] if i + 1 < len(positions) else len(text)]
        body = re.split(r"^WORKS? UPON THE ", body, maxsplit=1, flags=re.M)[0]
        heads = list(VERSE_HEAD.finditer(body))
        if not heads:
            if body.strip(): overview += f"\n\n{label}\n\n{body.strip()}"
            continue
        pre = body[: heads[0].start()].strip()
        if pre: overview += f"\n\n{label}\n\n{pre}"
        for j, h in enumerate(heads):
            chunk = body[h.start(): heads[j + 1].start() if j + 1 < len(heads) else len(body)].strip()
            a, b2 = int(h.group(2)), int(h.group(3)) if h.group(3) else None
            key = f"{a}-{b2}" if b2 and b2 > a else str(a)
            if key not in by_verse: by_verse[key] = {}; order.append(key)
            by_verse[key].setdefault(label, []).append(chunk)
    def sort_key(k): return tuple(int(x) for x in k.split("-"))
    entries = [["intro", overview]] if overview else []
    for key in sorted(order, key=sort_key):
        parts = [f"{label}\n\n" + "\n\n".join(chunks) for label, chunks in
                 ((lbl, by_verse[key].get(lbl)) for _, lbl in SPURGEON_SECTIONS) if chunks]
        entries.append([key, "\n\n".join(parts)])
    return entries

def build_commentary(mod_id, path, mod_type, source, block, encoding="utf-8"):
    com = open_module(path, mod_type, "kjv", source, block, encoding)
    total_entries = books_done = 0
    for b in books_of(com):
        book = app_name(b.name)
        usfm = USFM.get(book)
        if not usfm: continue
        chapters = {}
        for ch in range(1, b.num_chapters + 1):
            entries, prev_raw, start = [], None, None
            def flush(end):
                if prev_raw is None: return
                text = clean(prev_raw, source)
                if text: entries.append([f"{start}" if start == end else f"{start}-{end}", text])
            n = b.chapter_lengths[ch - 1]
            for v in range(1, n + 1):
                raw = safe_get(com, b.name, ch, v)
                if raw and raw == prev_raw:            # linked entry covering a range
                    continue
                flush(v - 1)
                prev_raw, start = (raw or None), v
            flush(n)
            if mod_id == "spurgeon-treasury-of-david" and entries:
                entries = split_spurgeon("\n\n".join(e[1] for e in entries))
            if entries:
                chapters[str(ch)] = entries
                total_entries += len(entries)
        if chapters:
            write("commentary", mod_id, usfm, chapters); books_done += 1
    print(f"commentary {mod_id}: {books_done} books, {total_entries} entries")

BIBLES = [
    ("wycliffe", "texts/ztext/wycliffe", "ztext", "vulg", "OSIS", BlockType.BOOK),
    ("tyndale", "texts/ztext/tyndale", "ztext", "kjv", "OSIS", BlockType.BOOK),
]
B, C = BlockType.BOOK, BlockType.CHAPTER
COMMENTARIES = [
    ("spurgeon-treasury-of-david", "comments/zcom/tdavid", "ztext4", "OSIS", B, "utf-8"),
    ("barnes", "comments/zcom/barnes", "ztext", "ThML", C, "utf-8"),
    ("wesley", "comments/zcom/wesley", "ztext", "ThML", B, "latin1"),
    ("matthew-henry-concise", "comments/zcom/mhcc", "ztext", "OSIS", B, "utf-8"),
    ("treasury-of-scripture-knowledge", "comments/zcom/tsk", "ztext", "ThML", B, "latin1"),
    ("scofield", "comments/zcom/scofield", "ztext", "OSIS", B, "utf-8"),
    ("geneva-notes", "comments/zcom/geneva", "ztext", "ThML", B, "latin1"),
    ("peoples-new-testament", "comments/zcom/pnt", "ztext", "ThML", B, "latin1"),
    ("family-bible-notes", "comments/zcom/family", "ztext", "ThML", B, "latin1"),
    ("burkitt", "comments/zcom/burkitt", "ztext", "OSIS", C, "utf-8"),
    ("catena-aurea", "comments/zcom/catena", "ztext", "OSIS", C, "utf-8"),
    ("lightfoot", "comments/zcom/lightfoot", "ztext", "ThML", B, "latin1"),
    ("fourfold-gospel", "comments/rawcom/tfg", "rawtext", "GBF", None, "latin1"),
]

only = set(sys.argv[3:])
for spec in BIBLES:
    if not only or spec[0] in only: build_bible(*spec)
for spec in COMMENTARIES:
    if not only or spec[0] in only: build_commentary(*spec)
