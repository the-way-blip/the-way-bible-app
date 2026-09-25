import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { LIBRARY, findBook, getBookIndex, getBookSection } from "../services/libraryService";
import { linkifyRefs } from "../components/RefText";

export default function Library() {
  const { bookId, section } = useParams();
  if (bookId && section !== undefined) return <SectionReader bookId={bookId} n={parseInt(section, 10)} />;
  if (bookId) return <BookContents bookId={bookId} />;
  return <Shelf />;
}

function Shelf() {
  useDocumentTitle("Library");
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-bold text-warm-brown mb-1">Library</h1>
      <p className="text-xs text-warm-brown-light mb-5">Confessions, Christian classics and history — complete and free.</p>
      <Link to="/how-to-study-the-bible" className="flex items-center justify-between bg-white border border-cream-dark rounded-2xl px-4 py-3 mb-3 hover:border-gold/30">
        <div>
          <p className="text-[10px] font-medium text-gold uppercase tracking-wider">Start here</p>
          <p className="text-sm font-semibold text-warm-brown">How to Study the Bible</p>
        </div>
        <span className="text-gold">›</span>
      </Link>
      <Link to="/devotional" className="flex items-center justify-between bg-gold/10 border border-gold/20 rounded-2xl px-4 py-3 mb-6">
        <div>
          <p className="text-[10px] font-medium text-gold uppercase tracking-wider">Daily devotionals</p>
          <p className="text-sm font-semibold text-warm-brown">Spurgeon's Morning and Evening · Daily Light</p>
        </div>
        <span className="text-gold">›</span>
      </Link>
      {LIBRARY.map((g) => (
        <section key={g.group} className="mb-6">
          <h2 className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">{g.group}</h2>
          <div className="space-y-2">
            {g.books.map((b) => (
              <Link key={b.id} to={`/library/${b.id}`} className="block bg-white border border-cream-dark rounded-xl px-4 py-3 hover:border-gold/30 transition-colors">
                <p className="font-serif font-bold text-warm-brown">{b.title}</p>
                <p className="text-[11px] text-gold">{b.author}</p>
                <p className="text-xs text-warm-brown-light mt-1">{b.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <p className="text-[10px] text-warm-brown-light/60">Public-domain texts, via the CrossWire Bible Society.</p>
    </div>
  );
}

function BookContents({ bookId }) {
  const book = findBook(bookId);
  const [toc, setToc] = useState(null);
  useDocumentTitle(book?.title || "Library");
  useEffect(() => { getBookIndex(bookId).then((i) => setToc(i?.sections || [])); }, [bookId]);
  if (!book) return <p className="p-8 text-center text-sm text-warm-brown-light">Book not found.</p>;
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <Link to="/library" className="text-xs text-warm-brown-light hover:text-warm-brown">‹ Library</Link>
      <h1 className="font-serif text-2xl font-bold text-warm-brown mt-2">{book.title}</h1>
      <p className="text-sm text-gold mb-5">{book.author}</p>
      {!toc ? <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto my-8" /> : (
        <ol className="divide-y divide-cream-dark bg-white border border-cream-dark rounded-xl">
          {toc.map(([title], i) => (
            <li key={i}>
              <Link to={`/library/${bookId}/${i}`} className="block px-4 py-2.5 text-sm text-warm-brown hover:bg-cream/50">{title}</Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function SectionReader({ bookId, n }) {
  const book = findBook(bookId);
  const [sec, setSec] = useState(null);
  useDocumentTitle(sec ? `${sec.title} — ${book?.title}` : book?.title || "Library");
  useEffect(() => {
    let cancelled = false;
    setSec(null);
    window.scrollTo?.(0, 0);
    getBookSection(bookId, n).then((s) => { if (!cancelled) setSec(s || { missing: true }); });
    return () => { cancelled = true; };
  }, [bookId, n]);

  if (!book) return <p className="p-8 text-center text-sm text-warm-brown-light">Book not found.</p>;
  const nav = sec && !sec.missing && (
    <div className="flex items-center justify-between text-xs mt-6">
      {n > 0 ? <Link to={`/library/${bookId}/${n - 1}`} className="text-gold">‹ Previous</Link> : <span />}
      <Link to={`/library/${bookId}`} className="text-warm-brown-light">Contents</Link>
      {n < sec.total - 1 ? <Link to={`/library/${bookId}/${n + 1}`} className="text-gold">Next ›</Link> : <span />}
    </div>
  );
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <Link to={`/library/${bookId}`} className="text-xs text-warm-brown-light hover:text-warm-brown">‹ {book.title}</Link>
      {!sec ? <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto my-12" /> :
        sec.missing ? <p className="p-8 text-center text-sm text-warm-brown-light">Section not found.</p> : (
        <article>
          <h1 className="font-serif text-xl font-bold text-warm-brown mt-2 mb-4">{sec.title}</h1>
          <p className="font-scripture text-[15px] text-warm-brown leading-relaxed whitespace-pre-wrap">{linkifyRefs(sec.text)}</p>
          {nav}
        </article>
      )}
    </div>
  );
}
