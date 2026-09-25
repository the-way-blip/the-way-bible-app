#!/usr/bin/env python3
"""
Aligns the LibriVox "Bible (KJV), Complete" recording (Michael Armenta, project 10501)
to the KJV text, producing chapter and verse start times for the audio player.

  python3 scripts/align-librivox-kjv.py <workdir>
    <workdir>/complete.json   LibriVox API record (sections with listen_url + title)
    <workdir>/extra.json      fill-ins for chapters the complete recording skips (copy of scripts/librivox-extra.json)
    <workdir>/words/*.json    faster-whisper word timestamps per section: [[start, end, word], ...]
Writes public/data/audio/kjv/<USFM>.json:
    { "<ch>": [sectionIndex, startSec, endSec, [verse1Start, verse2Start, ...]] }
and public/data/audio/kjv/sections.json: [listen_url, ...]
"""
import difflib, json, os, re, sys
W = sys.argv[1]
REPO = os.path.join(os.path.dirname(__file__), "..")
index = json.load(open(os.path.join(REPO, "public/data/search-index.json")))
usfm = {}
for line in open(os.path.join(REPO, "src/data/translations.js")).read().split("USFM_BOOK_IDS")[1].splitlines():
    m = re.match(r'\s*"?([^":]+?)"?\s*:\s*"([A-Z0-9]{3})"', line)
    if m: usfm[m.group(1)] = m.group(2)
verses = {}
for e in index: verses.setdefault(e["b"], {}).setdefault(e["c"], {})[e["v"]] = e["t"]
norm = lambda w: re.sub(r"[^a-z]", "", w.lower())

sections = json.load(open(os.path.join(W, "complete.json")))["books"][0]["sections"]
for sec in sections: sec["reader"] = (sec.get("readers") or [{}])[0].get("display_name", "Michael Armenta")
# Chapters the complete recording skips (Exodus 22, 2 Chronicles 4 & 8, Job 14) come from other
# LibriVox KJV projects, listed in extra.json with the only chapters they may supply.
extra_path = os.path.join(W, "extra.json")
if os.path.exists(extra_path): sections += json.load(open(extra_path))
out, stats, best = {}, [], {}
for si, sec in enumerate(sections):
    m = re.match(r"^(.+?)\s+(?:Ch\.?\s*)?(\d+)(?:\s*-\s*(\d+))?$", sec["title"].strip())
    book, c1, c2 = m.group(1).strip(), int(m.group(2)), int(m.group(3) or m.group(2))
    book = {"Psalm": "Psalms", "Phillipians": "Philippians"}.get(book, book)   # LibriVox title typos
    name = os.path.basename(sec["listen_url"])[:-4]
    wf = os.path.join(W, "words", name + ".json")
    if not os.path.exists(wf): continue
    words = json.load(open(wf))
    asr = [norm(w[2]) for w in words]
    kjv, labels = [], []
    for c in range(c1, c2 + 1):
        for v, t in sorted(verses[book][c].items()):
            for tok in t.split():
                n = norm(tok)
                if n: kjv.append(n); labels.append((c, v))
    sm = difflib.SequenceMatcher(None, kjv, asr, autojunk=False)
    k2a = {}
    for a, b, size in sm.get_matching_blocks():
        for i in range(size): k2a[a + i] = b + i
    starts = {}      # (c, v) → time of the verse's first matched word
    first_idx = {}
    for i, lab in enumerate(labels):
        first_idx.setdefault(lab, i)
    matched = 0
    floor = 0        # ASR index after the previous verse's first match (keeps order)
    direct = set()
    for lab, i in first_idx.items():
        # first word of the verse that matched, then step back over the unmatched opening words
        j = i
        while j < len(labels) and labels[j] == lab and j not in k2a: j += 1
        if j < len(labels) and labels[j] == lab:
            a_idx = max(k2a[j] - (j - i), floor)
            starts[lab] = words[a_idx][0]; matched += 1; direct.add(lab)
            floor = k2a[j] + 1
    # fill gaps by interpolation (monotonic)
    labs = list(first_idx.keys())
    known = [(k, starts[l]) for k, l in enumerate(labs) if l in starts]
    for k, l in enumerate(labs):
        if l in starts: continue
        prev = max((x for x in known if x[0] < k), default=None, key=lambda x: x[0])
        nxt = min((x for x in known if x[0] > k), default=None, key=lambda x: x[0])
        if prev and nxt: starts[l] = prev[1] + (nxt[1] - prev[1]) * (k - prev[0]) / (nxt[0] - prev[0])
        elif prev: starts[l] = prev[1]
        elif nxt: starts[l] = max(0, nxt[1] - 1)
    # enforce monotonic order
    last = 0
    for l in labs:
        starts[l] = max(starts[l], last); last = starts[l]
    total_end = words[-1][1] if words else 0
    for c in range(c1, c2 + 1):
        vs = [round(starts[(c, v)], 2) for v in sorted(verses[book][c])]
        start = vs[0]
        # include the spoken "Chapter N" announcement just before verse 1
        for w in reversed(words):
            if w[0] < start and start - w[0] < 8 and norm(w[2]) in ("chapter", "psalm"): start = w[0]; break
        if c == c1: start = max(0, start - 0.3)
        nxt = c + 1
        end = None
        if nxt <= c2:
            end = starts[(nxt, 1)]
            for w in reversed(words):
                if w[0] < end and end - w[0] < 8 and norm(w[2]) in ("chapter", "psalm"): end = w[0]; break
        else:
            # stop before LibriVox's closing "End of section …" announcement
            tail = [w for w in words if w[0] > vs[-1] and norm(w[2]) == "end"]
            end = tail[0][0] if tail else total_end
        # A chapter can be claimed by two sections when LibriVox's titles are off by one;
        # keep the one whose audio actually matches the chapter's text best.
        score = sum(1 for v in verses[book][c] if (c, v) in direct) / len(verses[book][c])
        if end - start < 20: score = -1
        if sec.get("only") and c not in sec["only"]: continue
        prev = best.get((book, c))
        if prev is None or score > prev:
            best[(book, c)] = score
            out.setdefault(usfm[book], {})[str(c)] = [si, round(start, 2), round(end, 2), vs]
    stats.append((sec["title"], matched, len(first_idx)))
    print(f"{si:3d} {sec['title']:<28} verses matched {matched}/{len(first_idx)} ({100*matched/len(first_idx):.0f}%)", flush=True)

d = os.path.join(REPO, "public/data/audio/kjv"); os.makedirs(d, exist_ok=True)
for u, chs in out.items(): json.dump(chs, open(os.path.join(d, f"{u}.json"), "w"), separators=(",", ":"))
json.dump([s["listen_url"].replace("http://", "https://").replace("www.archive.org", "archive.org") for s in sections], open(os.path.join(d, "sections.json"), "w"))
json.dump([s["reader"] for s in sections], open(os.path.join(d, "readers.json"), "w"))
tm = sum(s[1] for s in stats); tv = sum(s[2] for s in stats)
print(f"TOTAL {len(stats)} sections, {tm}/{tv} verses directly matched ({100*tm/max(tv,1):.1f}%)")
