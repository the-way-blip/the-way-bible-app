#!/usr/bin/env python3
"""
Builds dictionaries, topical indexes, devotionals and classic books from
CrossWire SWORD modules into static JSON under public/data/.

  .sword-venv/bin/python scripts/build-library-data.py <unzipped-modules-folder>

Outputs
  dict/<id>/<chunk>.json        { HEADWORD: text }   (chunk = first letter, or two for big dictionaries)
  dict/index.json               { "sources": [...ids], "words": [[display, [sourceIndexes]], ...] }
  devotionals/<id>/<MM>.json    { "MM.DD": text }
  library/<id>/index.json       { "sections": [[title, file, i], ...] }
  library/<id>/<n>.json         [[title, text], ...]
"""
import html, json, os, re, sys, shutil
sys.path.insert(0, os.path.dirname(__file__))
from sword_extra import read_rawld, read_zld, read_genbook

SRC = os.path.join(sys.argv[1], "modules")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "data")

def clean(t):
    t = t.replace("\r", "").replace("\n", " ")     # source line-wraps; structure comes from tags
    t = re.sub(r"<title[^>]*>.*?</title>", "", t, flags=re.S)
    t = re.sub(r"<note[^>]*>.*?</note>", "", t, flags=re.S)
    t = re.sub(r"<(lb|br)\s*/?>", "\n", t, flags=re.I)
    t = re.sub(r"</?(p|div|entryFree|def)\b[^>]*>", "\n\n", t, flags=re.I)
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t).replace(" ", " ").replace("\r", "")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r" *\n *", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()

OSIS_BOOKS = dict(zip(
    "Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal "
    "Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev".split(),
    ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
     "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah",
     "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
     "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians",
     "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
     "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"]))

def osis_to_text(ref):
    """'2Tim.3.15-2Tim.3.17' → '2 Timothy 3:15-17' (None if unparseable)."""
    parts = ref.replace("Bible:", "").split("-")
    m = re.match(r"^(\w+)\.(\d+)(?:\.(\d+))?$", parts[0])
    if not m or m.group(1) not in OSIS_BOOKS: return None
    out = f"{OSIS_BOOKS[m.group(1)]} {m.group(2)}" + (f":{m.group(3)}" if m.group(3) else "")
    if len(parts) > 1:
        e = re.match(r"^(?:\w+\.)?(\d+)(?:\.(\d+))?$", parts[1])
        if e: out += "-" + (e.group(2) if e.group(2) and e.group(1) == m.group(2) else (f"{e.group(1)}:{e.group(2)}" if e.group(2) else e.group(1)))
    return out

def with_proofs(t):
    """Footnotes → numbered markers with a 'Scripture proofs' list; OSIS references → linkable text."""
    t = re.sub(r'<reference[^>]*osisRef="([^"]+)"[^>]*>.*?</reference>', lambda m: osis_to_text(m.group(1)) or "", t, flags=re.S)
    t = re.sub(r"\s*\\\.\s*", "; ", t)            # source separates some references with a literal "\."
    notes = []
    def keep(m):
        notes.append(clean(m.group(1)).replace("\n\n", " ").replace("\n", " "))
        return f" [{len(notes)}]"
    t = re.sub(r"<note[^>]*>(.*?)</note>", keep, t, flags=re.S)
    body = clean(t)
    if notes: body += "\n\nSCRIPTURE PROOFS\n" + "\n".join(f"[{i + 1}] {n}" for i, n in enumerate(notes) if n)
    return body

def section_heading(t):
    m = re.search(r"<title[^>]*>(.*?)</title>", t, flags=re.S)
    return clean(m.group(1)) if m else None

def reset(path):
    if os.path.isdir(path): shutil.rmtree(path)
    os.makedirs(path)

def dump(path, data):
    with open(path, "w") as f: json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

# ── Dictionaries & topical indexes ─────────────────────────────────────────
DICTS = [  # id, reader, path, encoding, chunk-by-two-letters
    ("easton",    "zld",   "lexdict/zld/easton/easton",       "utf-8",  False),
    ("smith",     "rawld", "lexdict/rawld/smith/smith",       "latin1", False),
    ("isbe",      "zld",   "lexdict/zld/isbe/isbe",           "utf-8",  True),
    ("amtract",   "rawld", "lexdict/rawld/amtract/amtract",   "latin1", False),
    ("hitchcock", "zld",   "lexdict/zld/hitchcock/dict",      "utf-8",  False),
    ("nave",      "zld",   "lexdict/zld/nave/dict",           "utf-8",  True),
    ("torrey",    "rawld", "lexdict/rawld/torrey/torrey",     "latin1", False),
    ("tcr",       "rawld", "lexdict/rawld/tcr/tcr",           "latin1", False),
]

def norm_key(k): return re.sub(r"\s+", " ", k.upper().strip())

SMALL = {"of", "the", "and", "in", "on", "to", "a", "an", "at", "by", "for", "from", "or", "with"}
ROMAN = re.compile(r"^(I|II|III|IV|V|VI|VII|VIII|IX|X)$")
def display_case(k):
    if k != k.upper(): return k.strip()
    words = k.strip().lower().split(" ")
    out = []
    for i, w in enumerate(words):
        if ROMAN.match(w.upper()): out.append(w.upper())
        elif i and w in SMALL: out.append(w)
        else: out.append("-".join(x[:1].upper() + x[1:] for x in w.split("-")))
    return " ".join(out)
def chunk_of(key, two):
    letters = re.sub(r"[^A-Z]", "", key)
    if not letters: return "_"
    return letters[:2] if two and len(letters) > 1 else letters[0]

def read_any(kind, path, enc):
    base = os.path.join(SRC, path)
    return read_zld(base, enc) if kind == "zld" else read_rawld(base, enc)

index = {}   # NORMKEY → [display, set(source idx)]
for si, (did, kind, path, enc, two) in enumerate(DICTS):
    raw = read_any(kind, path, enc)
    entries = {}
    for k, v in raw:
        if not k: continue
        entries[norm_key(k)] = (k.strip(), v)
    out = {}
    for nk, (disp, v) in entries.items():
        if v.strip().startswith("@LINK"):
            target = norm_key(v.strip()[5:])
            if target in entries and not entries[target][1].strip().startswith("@LINK"):
                v = entries[target][1]
            else:
                continue
        v = re.sub(r'<ref[^>]*osisRef="([^"]+)"[^>]*>.*?</ref>', lambda m: osis_to_text(m.group(1)) or m.group(0), v, flags=re.S)
        text = clean(v)
        if not text: continue
        out.setdefault(chunk_of(nk, two), {})[nk] = text
        slot = index.setdefault(nk, [display_case(disp), set()])
        if disp != disp.upper() and slot[0] != disp: slot[0] = disp.strip()   # a source's own casing wins
        slot[1].add(si)
    d = os.path.join(OUT, "dict", did); reset(d)
    for ch, data in out.items(): dump(os.path.join(d, f"{ch}.json"), data)
    print(f"dict {did}: {sum(len(x) for x in out.values())} entries in {len(out)} files")

words = sorted(([disp, sorted(s)] for disp, s in index.values()), key=lambda x: x[0].upper())
dump(os.path.join(OUT, "dict", "index.json"), {"sources": [d[0] for d in DICTS], "twoLetter": [d[0] for d in DICTS if d[4]], "words": words})
print(f"dict index: {len(words)} headwords")

# ── Devotionals ────────────────────────────────────────────────────────────
DEVOTIONALS = [("morning-evening", "zld", "lexdict/zld/devotionals/sme/sme", "utf-8"),
               ("daily-light", "rawld", "lexdict/rawld/devotionals/daily/daily", "latin1")]
for did, kind, path, enc in DEVOTIONALS:
    months = {}
    for k, v in read_any(kind, path, enc):
        if not re.match(r"^\d\d\.\d\d$", k): continue
        # keep "Morning, January 1" style section titles as plain lines
        v = re.sub(r"<title[^>]*>(.*?)</title>", lambda m: "\n\n" + clean(m.group(1)).upper() + "\n\n", v, flags=re.S)
        text = clean(v)
        if did == "daily-light":   # hard-wrapped with <br />: join lines, keep paragraph breaks
            text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)
        months.setdefault(k[:2], {})[k] = text
    d = os.path.join(OUT, "devotionals", did); reset(d)
    for m, data in months.items(): dump(os.path.join(d, f"{m}.json"), data)
    print(f"devotional {did}: {sum(len(x) for x in months.values())} days")

# ── Books ──────────────────────────────────────────────────────────────────
BOOKS = [  # id, module dir, encoding
    ("baptist-confession-1689", "baptistconfession1689", "utf-8"),
    ("baptist-confession-1646", "baptistconfession1646", "utf-8"),
    ("westminster", "westminster", "utf-8"),
    ("pilgrims-progress", "pilgrim", "utf-8"),
    ("josephus", "josephus", "latin1"),
    ("ryle-holiness", "jcrholiness", "utf-8"),
    ("bounds-reality-of-prayer", "embreality", "utf-8"),
    ("owen-glory-of-christ", "jochrist", "utf-8"),
    ("owen-mortification-of-sin", "jomortsin", "utf-8"),
    ("edwards-religious-affections", "jeaffections", "utf-8"),
    ("edwards-sermons", "jesermons", "utf-8"),
    ("finney-sermons", "finney", "utf-8"),
    ("practice-of-the-presence-of-god", "practice", "utf-8"),
    ("imitation-of-christ", "imitation", "utf-8"),
    ("calvin-institutes", "institutes", "utf-8"),
]
CHUNK = 150_000
for bid, mod, enc in BOOKS:
    sections = read_genbook(os.path.join(SRC, "genbook", "rawgenbook", mod, mod), enc)
    d = os.path.join(OUT, "library", bid); reset(d)
    toc, buf, size, n = [], [], 0, 0
    for path, raw in sections:
        title = " — ".join(p for p in path if p) or section_heading(raw) or "Untitled"
        text = with_proofs(raw)
        if not text: continue
        if buf and size + len(text) > CHUNK:
            dump(os.path.join(d, f"{n}.json"), buf); n += 1; buf, size = [], 0
        toc.append([title, n, len(buf)]); buf.append([title, text]); size += len(text)
    if buf: dump(os.path.join(d, f"{n}.json"), buf)
    dump(os.path.join(d, "index.json"), {"sections": toc})
    print(f"book {bid}: {len(toc)} sections in {n + 1} files")
