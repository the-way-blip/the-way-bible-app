#!/usr/bin/env python3
"""
Turns the parsed "The God Who Leads" (Drew Rogers) into
  public/data/commentary/the-god-who-leads/<USFM>.json   (commentary entries per passage)
  public/data/library/the-god-who-leads/                 (the full book, chapter by chapter)

  python3 scripts/books/parse-the-god-who-leads.py <workdir>   # needs <workdir>/books/joshua.txt (PDF text)
  python3 scripts/books/build-the-god-who-leads.py <workdir>/books/joshua-parsed.json
"""
import json, os, re, sys, shutil
parsed = json.load(open(sys.argv[1]))
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "data")
VERSES = {("EXO", 17): 16, ("NUM", 13): 33, ("NUM", 14): 45, ("NUM", 27): 23, ("NUM", 32): 42, ("NUM", 35): 34,
          ("DEU", 1): 46, ("DEU", 31): 30}

# Book chapter → passages it teaches: (USFM, chapter, first verse, last verse or None = whole chapter)
MAP = {
    0:  [("JOS", 1, 1, None)],
    1:  [("EXO", 17, 8, 16)],
    2:  [("NUM", 13, 1, None), ("NUM", 14, 1, None), ("DEU", 1, 19, 46)],
    3:  [("NUM", 14, 26, 45)],
    4:  [("JOS", 1, 1, 9), ("DEU", 31, 1, 8)],
    5:  [("JOS", 11, 16, 23), ("JOS", 12, 1, None)],
    6:  [("NUM", 32, 1, None), ("JOS", 1, 12, 18)],
    7:  [("JOS", 3, 1, None)],
    8:  [("JOS", 1, 1, None), ("NUM", 27, 15, 23)],
    9:  [("JOS", 4, 1, None)],
    10: [("JOS", 5, 1, 12)],
    11: [("JOS", 5, 13, 15), ("JOS", 6, 1, 5)],
    12: [("JOS", 6, 1, None)],
    13: [("JOS", 7, 1, None), ("JOS", 8, 1, None)],
    14: [("JOS", 9, 1, None)],
    15: [("JOS", 10, 1, None)],
    16: [("JOS", 22, 1, None)],
    17: [("JOS", 20, 1, None), ("NUM", 35, 9, 34)],
    18: [("JOS", 24, 1, None), ("JOS", 23, 1, None)],
    99: [("JOS", 24, 14, 28)],
}
KJV_LAST = json.load(open(os.path.join(os.path.dirname(__file__), "..", "..", "src", "data", "verseCounts.json")))

def render(ch):
    parts = []
    for kind, text in ch["blocks"]:
        text = re.sub(r"“\s+", "“", text).replace(" ”", "”")
        if kind == "h": parts.append(text.upper())
        elif kind == "q": parts.append(f"❝ {text[:1]}{text[1:].lower()} ❞")
        elif kind == "li": parts.append(f"• {text}")
        else: parts.append(text)
    return "\n\n".join(parts)

label = lambda ch: ch["title"] if ch["num"] in (0, 99) else f"Chapter {ch['num']} — {ch['title']}"

# Commentary
com = {}
for ch in parsed:
    body = f"{label(ch).upper()}\n\n{render(ch)}"
    for usfm, c, a, b in MAP[ch["num"]]:
        b = b or KJV_LAST[usfm][c - 1]
        com.setdefault(usfm, {}).setdefault(str(c), []).append([f"{a}-{b}" if b != a else str(a), body])
d = os.path.join(OUT, "commentary", "the-god-who-leads")
if os.path.isdir(d): shutil.rmtree(d)
os.makedirs(d)
for usfm, chs in com.items():
    for c in chs.values(): c.sort(key=lambda e: int(e[0].split("-")[0]))
    json.dump(chs, open(os.path.join(d, f"{usfm}.json"), "w"), ensure_ascii=False, separators=(",", ":"))
print("commentary:", {u: sorted(int(c) for c in chs) for u, chs in com.items()})

# Library
d = os.path.join(OUT, "library", "the-god-who-leads")
if os.path.isdir(d): shutil.rmtree(d)
os.makedirs(d)
order = sorted(parsed, key=lambda c: c["num"])
toc, files, n, buf, size = [], [], 0, [], 0
for ch in order:
    text = render(ch)
    if buf and size + len(text) > 150_000:
        json.dump(buf, open(os.path.join(d, f"{n}.json"), "w"), ensure_ascii=False, separators=(",", ":")); n += 1; buf, size = [], 0
    toc.append([label(ch), n, len(buf)]); buf.append([label(ch), text]); size += len(text)
json.dump(buf, open(os.path.join(d, f"{n}.json"), "w"), ensure_ascii=False, separators=(",", ":"))
json.dump({"sections": toc}, open(os.path.join(d, "index.json"), "w"), ensure_ascii=False)
print("library:", len(toc), "chapters")
