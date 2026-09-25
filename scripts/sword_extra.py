"""Readers for SWORD RawLD, zLD (dictionaries/devotionals) and RawGenBook (books)."""
import struct, zlib, os

def _dec(b, enc): return b.decode(enc, errors="replace")

def read_rawld(base, enc="latin1", size_bytes=2):
    idx = open(base + ".idx", "rb").read(); dat = open(base + ".dat", "rb").read()
    step = 4 + size_bytes; out = []
    for i in range(0, len(idx) - step + 1, step):
        off = struct.unpack_from("<I", idx, i)[0]
        size = struct.unpack_from("<H" if size_bytes == 2 else "<I", idx, i + 4)[0]
        raw = dat[off:off + size]
        nl = raw.find(b"\n")
        key = _dec(raw[:nl], enc).strip(); text = _dec(raw[nl + 1:], enc)
        out.append((key, text))
    return out

def read_zld(base, enc="utf-8"):
    idx = open(base + ".idx", "rb").read(); dat = open(base + ".dat", "rb").read()
    zdx = open(base + ".zdx", "rb").read(); zdt = open(base + ".zdt", "rb").read()
    cache = {}; out = []
    def block(n):
        if n not in cache:
            off, size = struct.unpack_from("<II", zdx, n * 8)
            b = zlib.decompress(zdt[off:off + size])
            count = struct.unpack_from("<I", b, 0)[0]
            entries = []
            for k in range(count):
                eo, es = struct.unpack_from("<II", b, 4 + k * 8)
                entries.append(b[eo:eo + es].rstrip(b"\x00"))
            cache.clear(); cache[n] = entries
        return cache[n]
    for i in range(0, len(idx) - 7, 8):
        off, size = struct.unpack_from("<II", idx, i)
        raw = dat[off:off + size]
        nl = raw.find(b"\r\n")
        key = _dec(raw[:nl], enc).strip()
        rest = raw[nl + 2:]
        if len(rest) < 8: continue
        bn, en = struct.unpack_from("<II", rest, 0)
        entries = block(bn)
        text = _dec(entries[en], enc) if en < len(entries) else ""
        out.append((key, text))
    return out

def read_genbook(base, enc="utf-8"):
    """Returns [(path_list, text)] in document order. Tree links are node indexes (via .idx)."""
    idx = open(base + ".idx", "rb").read()
    tree = open(base + ".dat", "rb").read(); body = open(base + ".bdt", "rb").read()
    def node(i):
        off = struct.unpack_from("<I", idx, i)[0]   # links are byte offsets into .idx
        parent, nxt, child = struct.unpack_from("<iii", tree, off)
        end = tree.index(b"\x00", off + 12)
        name = _dec(tree[off + 12:end], enc)
        ulen = struct.unpack_from("<H", tree, end + 1)[0]
        text = ""
        if ulen >= 8:
            bo, bs = struct.unpack_from("<II", tree, end + 3)
            text = _dec(body[bo:bo + bs], enc)
        return name, nxt, child, text
    out = []
    stack = [(0, [])]
    while stack:
        i, path = stack.pop()
        if i < 0: continue
        name, nxt, child, text = node(i)
        p = path + [name] if name else path
        if text.strip(): out.append((p, text))
        stack.append((nxt, path))       # sibling after this subtree
        stack.append((child, p))        # children first
    return out
