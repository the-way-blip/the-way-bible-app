import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useBible from "../hooks/useBible";
import useHighlights from "../hooks/useHighlights";
import useNotes from "../hooks/useNotes";
import useMemoryVerses from "../hooks/useMemoryVerses";
import useWordStudy from "../hooks/useWordStudy";
import useChapterWordStudy from "../hooks/useChapterWordStudy";
import { getBook, getNextChapter, getPrevChapter } from "../data/bibleBooks";
import ChapterNav from "../features/reader/ChapterNav";
import ChapterOutline from "../features/reader/ChapterOutline";
import VerseList from "../features/reader/VerseList";
import VerseActions from "../features/reader/VerseActions";
import WordStudyPanel from "../features/reader/WordStudyPanel";
import AISummary from "../features/reader/AISummary";
import CommentaryPanel from "../features/reader/CommentaryPanel";
import SidePanel from "../features/reader/SidePanel";
import BibleMaps from "../features/reader/BibleMaps";
import YouTubeLinks from "../features/reader/YouTubeLinks";
import AIChat from "../features/reader/AIChat";
import AudioBible from "../features/reader/AudioBible";
import ParallelPassages from "../features/reader/ParallelPassages";
import ShareSheet from "../components/ShareSheet";
import { getHeaderQuote } from "../data/headerQuotes";
import { useApp } from "../stores/AppContext";
import useSwipe from "../hooks/useSwipe";
import useBookmarks from "../hooks/useBookmarks";

export default function Reader() {
  const { book, chapter } = useParams();
  const chapterNum = parseInt(chapter);
  const navigate = useNavigate();

  const { data, loading, error } = useBible(book, chapterNum);
  const { getHighlight, addHighlight } = useHighlights(book, chapterNum);
  const { notes, getNote, saveNote, deleteNote } = useNotes(book, chapterNum);
  const { addVerse, isMemoryVerse } = useMemoryVerses();
  const { wordData, loading: wordLoading, error: wordError, getWordStudy, clear: clearWordStudy } = useWordStudy();
  const { verseWords: chapterWords } = useChapterWordStudy(book, chapterNum, data?.verses);
  const { studyMode, toggleStudyMode, fontSize, setFontSize } = useApp();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();

  // Swipe navigation
  const swipeHandlers = useSwipe(
    () => next && goTo(next),   // swipe left → next chapter
    () => prev && goTo(prev),   // swipe right → prev chapter
  );

  const [selectedVerse, setSelectedVerse] = useState(null);
  const [showNav, setShowNav] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(
    () => parseInt(localStorage.getItem("sidebarWidth")) || 380
  );
  const [activeWordInfo, setActiveWordInfo] = useState(null);
  const [wordStudyVerse, setWordStudyVerse] = useState(null);
  const [loadingVerse, setLoadingVerse] = useState(null);
  const [pendingWord, setPendingWord] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);

  const headerQuote = getHeaderQuote();
  const bookInfo = getBook(book);
  const prev = getPrevChapter(book, chapterNum);
  const next = getNextChapter(book, chapterNum);
  const selectedVerseData = data?.verses?.find((v) => v.verse === selectedVerse);

  const saveProgress = () => {
    try {
      const progress = JSON.parse(localStorage.getItem("readingProgress") || "{}");
      if (!progress.completedChapters) progress.completedChapters = {};
      if (!progress.completedChapters[book]) progress.completedChapters[book] = [];
      if (!progress.completedChapters[book].includes(chapterNum)) {
        progress.completedChapters[book].push(chapterNum);
      }
      const today = new Date().toISOString().split("T")[0];
      if (progress.lastReadDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        progress.streak = progress.lastReadDate === yesterday ? (progress.streak || 0) + 1 : 1;
      }
      progress.lastReadDate = today;
      progress.lastRead = { book, chapter: chapterNum };
      localStorage.setItem("readingProgress", JSON.stringify(progress));
    } catch {}
  };

  const goTo = (target) => {
    if (!target) return;
    setSelectedVerse(null);
    setActiveWordInfo(null);
    setPendingWord(null);
    setWordStudyVerse(null);
    setLoadingVerse(null);
    clearWordStudy();
    saveProgress();
    navigate(`/read/${encodeURIComponent(target.book)}/${target.chapter}`);
  };

  const handleVerseNumberTap = (verse) => {
    setActiveWordInfo(null);
    setPendingWord(null);
    setSelectedVerse(verse);
  };

  const handleWordTap = useCallback(async (wordOrText, verseNumOrUndef, fullVerseText) => {
    setSelectedVerse(null);

    if (typeof wordOrText === "object" && (wordOrText.strongs || wordOrText.added)) {
      setPendingWord(null);
      setActiveWordInfo(wordOrText);
      return;
    }

    const tappedWord = typeof wordOrText === "string" ? wordOrText : wordOrText.word;
    const verseNum = verseNumOrUndef;
    const verseText = fullVerseText;
    if (!verseText || !verseNum) return;

    if (wordStudyVerse === verseNum && wordData) {
      const match = findMatchingWord(wordData, tappedWord);
      if (match) { setPendingWord(null); setActiveWordInfo(match); return; }
    }

    setPendingWord(tappedWord);
    setActiveWordInfo(null);
    setLoadingVerse(verseNum);
    setWordStudyVerse(verseNum);

    const result = await getWordStudy(book, chapterNum, verseNum, verseText);
    setLoadingVerse(null);

    if (result) {
      const match = findMatchingWord(result, tappedWord);
      if (match) { setPendingWord(null); setActiveWordInfo(match); }
      else setPendingWord(null);
    }
  }, [book, chapterNum, getWordStudy, wordData, wordStudyVerse]);

  const showWordPanel = activeWordInfo != null;
  const showLoadingPanel = !showWordPanel && pendingWord != null;

  return (
    <div className="flex h-[calc(100svh-4rem)]">
      {/* ─── Left: Scripture Reader ─── */}
      <div className="flex-1 min-w-0 overflow-y-auto" {...swipeHandlers}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <header className="sticky top-0 bg-cream/95 backdrop-blur-sm z-30 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setShowNav(true)}
              className="flex items-center gap-1.5 text-warm-brown font-semibold"
            >
              <span className="text-lg">{bookInfo?.name || book} {chapterNum}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5">
              {/* Font size quick-adjust */}
              <div className="flex items-center bg-cream-dark rounded-full">
                <button
                  onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                  className="px-1.5 py-1 text-[10px] text-warm-brown-light hover:text-warm-brown"
                  title="Smaller text"
                >A</button>
                <button
                  onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                  className="px-1.5 py-1 text-xs font-medium text-warm-brown-light hover:text-warm-brown"
                  title="Larger text"
                >A</button>
              </div>

              {/* Read / Study mode toggle */}
              <button
                onClick={toggleStudyMode}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                  studyMode
                    ? "bg-gold/10 text-gold"
                    : "bg-cream-dark text-warm-brown-light"
                }`}
                title={studyMode ? "Switch to Read mode" : "Switch to Study mode"}
              >
                {studyMode ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Study
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    Read
                  </>
                )}
              </button>

              {/* Toggle side panel (desktop only) */}
              <button
                onClick={() => setSidePanelOpen(!sidePanelOpen)}
                className="hidden md:flex items-center text-warm-brown-light hover:text-warm-brown transition-colors"
                title={sidePanelOpen ? "Close study panel" : "Open study panel"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
              </button>
            </div>
          </header>

          {/* Header quote */}
          <div className="px-4 py-2 mb-1">
            <p className="text-[11px] text-warm-brown-light/50 italic text-center leading-relaxed">
              "{headerQuote.text}" <span className="not-italic">— {headerQuote.ref}</span>
            </p>
          </div>

          {/* Chapter outline */}
          <ChapterOutline book={book} chapter={chapterNum} />

          {/* Content */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="mx-4 mt-4 p-4 bg-red-50 rounded-xl text-red-600 text-sm">
              Failed to load: {error}
            </div>
          )}

          {data && (
            <>
              <VerseList
                verses={data.verses}
                getHighlight={getHighlight}
                getNote={getNote}
                selectedVerse={selectedVerse}
                onVerseNumberTap={handleVerseNumberTap}
                onWordTap={handleWordTap}
                chapterWords={chapterWords}
              />

              {/* Mobile-only: Commentary + AI Summary below text */}
              <div className="md:hidden">
                <CommentaryPanel book={book} chapter={chapterNum} />
                <AISummary book={book} chapter={chapterNum} verses={data.verses} />
              </div>

              {/* Study tools below text */}
              <ParallelPassages book={book} chapter={chapterNum} />
              <AudioBible book={book} chapter={chapterNum} />
              <BibleMaps book={book} />
              <YouTubeLinks book={book} chapter={chapterNum} />

              {/* Chapter navigation */}
              <div className="flex items-center justify-between px-6 py-6">
                <button
                  onClick={() => goTo(prev)}
                  disabled={!prev}
                  className="flex items-center gap-1 text-sm text-warm-brown-light hover:text-warm-brown disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  {prev ? `${prev.book} ${prev.chapter}` : ""}
                </button>
                <button
                  onClick={() => goTo(next)}
                  disabled={!next}
                  className="flex items-center gap-1 text-sm text-warm-brown-light hover:text-warm-brown disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {next ? `${next.book} ${next.chapter}` : ""}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Right: Side Panel (desktop only, resizable) ─── */}
      {sidePanelOpen && (
        <div className="hidden md:flex shrink-0 relative" style={{ width: sidebarWidth }}>
          {/* Drag handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-gold/30 active:bg-gold/50 z-10 group"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = sidebarWidth;
              const onMove = (ev) => {
                const newWidth = Math.max(280, Math.min(600, startWidth - (ev.clientX - startX)));
                setSidebarWidth(newWidth);
              };
              const onUp = () => {
                localStorage.setItem("sidebarWidth", sidebarWidth);
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
              };
              document.addEventListener("mousemove", onMove);
              document.addEventListener("mouseup", onUp);
            }}
          >
            <div className="w-0.5 h-8 bg-cream-dark group-hover:bg-gold/50 rounded-full absolute top-1/2 -translate-y-1/2 left-0" />
          </div>
          <SidePanel
            book={book}
            chapter={chapterNum}
            notes={notes}
            activeWordInfo={activeWordInfo}
            onSaveNote={saveNote}
            onDeleteNote={deleteNote}
          />
        </div>
      )}

      {/* ─── Mobile overlays ─── */}

      {/* Verse action bar */}
      {selectedVerse && selectedVerseData && !showWordPanel && !showLoadingPanel && (
        <VerseActions
          verse={selectedVerse}
          verseText={selectedVerseData.text}
          book={book}
          chapter={chapterNum}
          currentHighlight={getHighlight(selectedVerse)}
          currentNote={getNote(selectedVerse)}
          isMemoryVerse={isMemoryVerse(book, chapterNum, selectedVerse)}
          isBookmarkedVerse={isBookmarked(book, chapterNum, selectedVerse)}
          onHighlight={addHighlight}
          onSaveNote={saveNote}
          onDeleteNote={deleteNote}
          onAddMemoryVerse={addVerse}
          onToggleBookmark={() => {
            if (isBookmarked(book, chapterNum, selectedVerse)) {
              removeBookmark(book, chapterNum, selectedVerse);
            } else {
              addBookmark(book, chapterNum, selectedVerse, selectedVerseData.text);
            }
          }}
          onAddToJournal={() => {
            navigate(`/journal/new?book=${encodeURIComponent(book)}&chapter=${chapterNum}&verse=${selectedVerse}&text=${encodeURIComponent(selectedVerseData.text)}`);
          }}
          onShare={() => {
            setShareData({ content: selectedVerseData.text, reference: `${book} ${chapterNum}:${selectedVerse}` });
            setSelectedVerse(null);
          }}
          onClose={() => setSelectedVerse(null)}
        />
      )}

      {/* Word study panel (centered modal — all screen sizes) */}
      {showWordPanel && (
        <WordStudyPanel wordInfo={activeWordInfo} onClose={() => setActiveWordInfo(null)} />
      )}
      {showLoadingPanel && (
        <WordLoadingPanel word={pendingWord} loading={wordLoading || loadingVerse} error={wordError} onClose={() => { setPendingWord(null); setLoadingVerse(null); }} />
      )}

      {/* Share sheet */}
      {shareData && (
        <ShareSheet content={shareData.content} reference={shareData.reference} onClose={() => setShareData(null)} />
      )}

      {/* Chapter nav overlay */}
      {showNav && (
        <ChapterNav currentBook={book} currentChapter={chapterNum} onClose={() => setShowNav(false)} />
      )}

      {/* AI Chat FAB */}
      {data && (
        <AIChat book={book} chapter={chapterNum} verses={data.verses} />
      )}
    </div>
  );
}

function WordLoadingPanel({ word, loading, error, onClose }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold text-warm-brown">"{word}"</span>
            <button onClick={onClose} className="text-warm-brown-light hover:text-warm-brown p-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {loading && (
            <div className="flex items-center justify-center gap-3 py-8">
              <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-warm-brown-light">Analyzing word study data...</span>
            </div>
          )}
          {error && <p className="text-sm text-red-500 text-center py-4">{error}</p>}
        </div>
      </div>
    </>
  );
}

function findMatchingWord(words, tappedWord) {
  const clean = tappedWord.replace(/[.,;:!?'"]/g, "").toLowerCase();
  let match = words.find((w) => !w.added && w.word.replace(/[.,;:!?'"]/g, "").toLowerCase() === clean);
  if (match) return match;
  match = words.find((w) => !w.added && w.word.toLowerCase().includes(clean));
  if (match) return match;
  match = words.find((w) => !w.added && clean.includes(w.word.replace(/[.,;:!?'"]/g, "").toLowerCase()));
  return match || null;
}
