import re, json, sys
SC = sys.argv[1]
pages = open(f"{SC}/books/joshua.txt").read().split("\n\f\n")

def fix(s):
    s = re.sub(r"\b([WYTV]) (?=[a-z])", r"\1", s)          # kerning splits: "W ord", "Y our"
    return s.replace("­", "")

chapters = []   # {num, title, pages:[lines]}
cur = None
for i, p in enumerate(pages):
    lines = [fix(l.rstrip()) for l in p.split("\n")]
    while lines and re.fullmatch(r"\s*\d{1,3}\s*", lines[-1]): lines.pop()   # page number
    text = "\n".join(lines).strip()
    m = re.match(r"^Chapter (\d+)\s*\n(.+?)$", text, re.S)
    if m and len(text) < 80:
        cur = {"num": int(m.group(1)), "title": " ".join(m.group(2).split()), "lines": []}; chapters.append(cur); continue
    if text in ("Introduction",) or re.match(r"^Conclusion\s*\n", text):
        title = "Introduction" if text == "Introduction" else "Conclusion — " + " ".join(text.split("\n")[1:])
        cur = {"num": 0 if text == "Introduction" else 99, "title": title, "lines": []}; chapters.append(cur); continue
    if cur: cur["lines"] += [l for l in lines if l.strip() != ""] + ["<PAGE>"]

def is_caps(l): 
    letters = re.sub(r"[^A-Za-z]", "", l)
    return len(letters) >= 2 and letters.isupper()

def build(ch):
    """→ list of blocks: ("h", text) | ("p", text) | ("q", text) | ("li", text)"""
    blocks, para, quote = [], [], []
    def flush():
        nonlocal para
        if para: blocks.append(("p", " ".join(para).replace("- ", "-") if False else " ".join(para))); para = []
    def flushq():
        nonlocal quote
        if quote: blocks.append(("q", " ".join(quote))); quote = []
    L = ch["lines"]
    for idx, l in enumerate(L):
        if l == "<PAGE>": continue
        s = l.strip()
        if is_caps(s) and not s.startswith("•"):
            flush(); quote.append(s); continue
        flushq()
        if s.startswith("•"):
            flush(); blocks.append(("li", s.lstrip("• ").strip())); continue
        if blocks and blocks[-1][0] == "li" and not para and not re.match(r"^[A-Z]", s):
            blocks[-1] = ("li", blocks[-1][1] + " " + s); continue
        # heading: short, no terminal punctuation, previous paragraph ended, next line starts a sentence
        prev_end = not para or re.search(r"[.!?:”\"’)]$", para[-1])
        if blocks and blocks[-1][0] == "h" and not para and len(s) < 30 and s[:1].islower():
            blocks[-1] = ("h", blocks[-1][1] + " " + s); continue          # heading wrapped onto a 2nd line
        if prev_end and len(s) < 42 and not re.search(r"[.,;:!?”\"(]", s) and s[:1].isupper():
            nxt = next((x.strip() for x in L[idx + 1: idx + 3] if x != "<PAGE>"), "")
            if nxt and (nxt[:1].isupper() or len(s) < 30):
                flush()
                if blocks and blocks[-1][0] == "h" and len(blocks[-1][1]) < 30 and not para: blocks[-1] = ("h", blocks[-1][1] + " " + s)
                else: blocks.append(("h", s))
                continue
        if para and para[-1].endswith("-") and not para[-1].endswith(" -"):
            para[-1] = para[-1] + s                      # word hyphenated across a line break
        else:
            para.append(s)
        if re.search(r"[.!?”\"’)]$", s) and len(s) < 44: flush()
    flush(); flushq()
    return blocks

out = []
for ch in chapters:
    blocks = build(ch)
    out.append({"num": ch["num"], "title": ch["title"], "blocks": blocks})
json.dump(out, open(f"{SC}/books/joshua-parsed.json", "w"), ensure_ascii=False, indent=1)
REF = re.compile(r"\b((?:[1-3] )?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Psalms?|Proverbs|Isaiah|Jeremiah|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Hebrews|James|Peter|Revelation|Samuel|Kings|Chronicles|Nehemiah|Daniel|Timothy|Titus|Micah|Habakkuk|Zechariah|Malachi|Ruth|Job|Ecclesiastes|Lamentations|Ezekiel|Hosea|Joel|Amos|Jonah|Thessalonians|Jude))\s(\d+):(\d+)")
for ch in out:
    heads = [b[1] for b in ch["blocks"] if b[0] == "h"]
    text = " ".join(b[1] for b in ch["blocks"])
    refs = REF.findall(text)
    from collections import Counter
    books = Counter(f"{b} {c}" for b, c, v in refs)
    print(f"\n[{ch['num']}] {ch['title']}  ({len(text)} chars, {len(ch['blocks'])} blocks)")
    print("   heads:", " | ".join(heads)[:300])
    print("   refs:", books.most_common(8))
