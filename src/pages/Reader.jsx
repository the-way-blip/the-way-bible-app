import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import TRANSLATIONS, { getTranslation } from "../data/translations";
import { useParams, useNavigate } from "react-router-dom";
import useBible from "../hooks/useBible";
import useHighlights from "../hooks/useHighlights";
import useNotes from "../hooks/useNotes";
import useMemoryVerses from "../hooks/useMemoryVerses";
import useWordStudy from "../hooks/useWordStudy";
import useChapterWordStudy from "../hooks/useChapterWordStudy";
import { getBook, getNextChapter, getPrevChapter } from "../data/bibleBooks";
import VerseList from "../features/reader/VerseList";
import VerseActions from "../features/reader/VerseActions";
import WordStudyPanel from "../features/reader/WordStudyPanel";
import SkeletonVerses from "../components/SkeletonVerses";

// Lazy loaded (below fold / modals / panels)
const ChapterNav = lazy(() => import("../features/reader/ChapterNav"));
const SidePanel = lazy(() => import("../features/reader/SidePanel"));
const ChapterTools = lazy(() => import("../features/reader/ChapterTools"));
const ShareSheet = lazy(() => import("../components/ShareSheet"));
import { useApp } from "../stores/AppContext";
import { useToast } from "../components/Toast";
import { useAuth } from "../stores/AuthContext";
import useSwipe from "../hooks/useSwipe";
import useBookmarks from "../hooks/useBookmarks";
import { syncReadingProgressUpdate } from "../services/supabaseSync";
import { submitReadingMilestone } from "../services/ghlService";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import AppendedChapter from "../features/reader/AppendedChapter";

export default function Reader() {
  const { book, chapter } = useParams();
  const chapterNum = parseInt(chapter);
  const navigate = useNavigate();

  const { studyMode, toggleStudyMode, fontSize, setFontSize, showVerseNumbers, toggleVerseNumbers, translation, setTranslation } = useApp();
  const { data, loading, error } = useBible(book, chapterNum, translation);
  const { getHighlight, addHighlight } = useHighlights(book, chapterNum);
  const { notes, getNote, saveNote, deleteNote } = useNotes(book, chapterNum);
  const { addVerse, isMemoryVerse } = useMemoryVerses();
  const { wordData, loading: wordLoading, error: wordError, getWordStudy, clear: clearWordStudy } = useWordStudy();
  const { verseWords: chapterWords } = useChapterWordStudy(book, chapterNum, data?.verses);
  const { user, profile } = useAuth();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const showToast = useToast();

  // Swipe navigation
  const swipeHandlers = useSwipe(
    () => next && goTo(next),   // swipe left → next chapter
    () => prev && goTo(prev),   // swipe right → prev chapter
  );

  const [selectedVerse, setSelectedVerse] = useState(null);
  const [activeChapterCtx, setActiveChapterCtx] = useState({ book, chapter: chapterNum });
  const [displayedChapter, setDisplayedChapter] = useState({ book, chapter: chapterNum });
  const [showNav, setShowNav] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(
    () => parseInt(localStorage.getItem("sidebarWidth")) || 380
  );
  const [activeWordInfo, setActiveWordInfo] = useState(null);
  const [wordStudyVerse, setWordStudyVerse] = useState(null);
  const [loadingVerse, setLoadingVerse] = useState(null);
  const [pendingWord, setPendingWord] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTranslationPicker, setShowTranslationPicker] = useState(false);

  // These need to be declared before the keyboard shortcuts effect
  const bookInfo = getBook(book);
  const prev = getPrevChapter(book, chapterNum);
  const next = getNextChapter(book, chapterNum);

  // Set document title and displayed chapter on direct navigation
  useEffect(() => {
    document.title = `${bookInfo?.name || book} ${chapterNum} — TheWay Bible App`;
    setDisplayedChapter({ book: bookInfo?.name || book, chapter: chapterNum });
    // Per-chapter <meta description> for SEO + link previews
    const desc = `Read ${bookInfo?.name || book} ${chapterNum} (KJV) in TheWay Bible App. Tap any word for Greek/Hebrew definitions, save verses to memorize, and journal what God shows you.`;
    let metaEl = document.querySelector('meta[name="description"]');
    if (metaEl) metaEl.setAttribute("content", desc);
    let ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl) ogTitleEl.setAttribute("content", `${bookInfo?.name || book} ${chapterNum} — TheWay Bible App`);
    let ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.setAttribute("content", desc);
  }, [book, chapterNum, bookInfo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;

      switch (e.key) {
        case "ArrowLeft":
          if (prev) goTo(prev);
          break;
        case "ArrowRight":
          if (next) goTo(next);
          break;
        case "Escape":
          setSelectedVerse(null);
          setShowNav(false);
          setActiveWordInfo(null);
          setShareData(null);
          setShowTranslationPicker(false);
          break;
        case "b":
        case "f":
          e.preventDefault();
          setShowNav(true);
          break;
        case "s":
          toggleStudyMode();
          break;
        case "/":
          e.preventDefault();
          window.location.href = "/search";
          break;
        default:
          return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next, toggleStudyMode]);

  // Infinite / continuous scroll
  const { extraChapters, extraChaptersBefore, loadingNext, loadingPrev, loadNextChapter, loadPrevChapter } = useInfiniteScroll(book, chapterNum, translation);
  const sentinelRef = useRef(null);
  const topSentinelRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const prevChaptersLenRef = useRef(0);
  const scrollSaveTimeout = useRef(null);
  const navigatedDirectly = useRef(true);

  // IntersectionObserver to trigger loading the next chapter
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextChapter();
        }
      },
      { root, rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextChapter, data]);

  // IntersectionObserver for loading previous chapter (scroll up)
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadPrevChapter();
        }
      },
      { root, rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadPrevChapter, data]);

  // Maintain scroll position when prepending chapters
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || extraChaptersBefore.length === 0) return;
    if (extraChaptersBefore.length > prevChaptersLenRef.current) {
      // A new chapter was prepended — adjust scroll to keep current content in place
      requestAnimationFrame(() => {
        const firstOriginal = container.querySelector(`[data-chapter-ref="${book}-${chapterNum}"]`);
        if (firstOriginal) {
          const offset = firstOriginal.offsetTop - 60; // account for sticky header
          container.scrollTop = offset;
        }
      });
    }
    prevChaptersLenRef.current = extraChaptersBefore.length;
  }, [extraChaptersBefore.length, book, chapterNum]);

  // Update URL as user scrolls into appended chapters (replaceState to avoid history pollution)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || (extraChapters.length === 0 && extraChaptersBefore.length === 0)) return;

    const handleScroll = () => {
      const markers = container.querySelectorAll("[data-chapter-ref]");
      const containerTop = container.getBoundingClientRect().top;
      // Header is sticky ~50px, so use an offset
      const offset = 120;

      let currentRef = `${book}-${chapterNum}`;
      for (const marker of markers) {
        const rect = marker.getBoundingClientRect();
        if (rect.top - containerTop < offset) {
          currentRef = marker.getAttribute("data-chapter-ref");
        }
      }

      const [scrollBook, scrollChapter] = currentRef.split(/-(?=[^-]+$)/);
      const expectedPath = `/read/${encodeURIComponent(scrollBook)}/${scrollChapter}`;
      if (window.location.pathname !== expectedPath) {
        window.history.replaceState(null, "", expectedPath);
        // Update displayed header title and document title
        const chNum = parseInt(scrollChapter);
        setDisplayedChapter({ book: scrollBook, chapter: chNum });
        document.title = `${scrollBook} ${chNum} — The Way`;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [book, chapterNum, extraChapters, extraChaptersBefore]);

  // Debounced scroll position saving
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      clearTimeout(scrollSaveTimeout.current);
      scrollSaveTimeout.current = setTimeout(() => {
        sessionStorage.setItem(`scroll-${book}-${chapterNum}`, container.scrollTop);
      }, 2000);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      // Save final position on unmount
      clearTimeout(scrollSaveTimeout.current);
      if (container) {
        sessionStorage.setItem(`scroll-${book}-${chapterNum}`, container.scrollTop);
      }
    };
  }, [book, chapterNum]);

  // Show/hide scroll-to-top button + track progress
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 500);
      // Calculate scroll progress
      const scrollHeight = container.scrollHeight - container.clientHeight;
      if (scrollHeight > 0) {
        setScrollProgress(Math.min(1, container.scrollTop / scrollHeight));
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Restore scroll position after data loads (only for direct navigation)
  useEffect(() => {
    if (!data || !navigatedDirectly.current) return;
    const saved = sessionStorage.getItem(`scroll-${book}-${chapterNum}`);
    if (!saved) return;

    const position = parseInt(saved, 10);
    if (!position || position <= 0) return;

    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = position;
      }
    });
    navigatedDirectly.current = false;
  }, [data, book, chapterNum]);

  // Find selected verse data — check primary chapter first, then appended chapters
  const selectedVerseData = (() => {
    if (!selectedVerse) return null;
    if (activeChapterCtx.book === book && activeChapterCtx.chapter === chapterNum) {
      return data?.verses?.find((v) => v.verse === selectedVerse);
    }
    const ch = extraChapters.find(
      (c) => c.book === activeChapterCtx.book && c.chapter === activeChapterCtx.chapter
    );
    return ch?.verses?.find((v) => v.verse === selectedVerse);
  })();

  const saveProgress = () => {
    try {
      const prevProgress = JSON.parse(localStorage.getItem("readingProgress") || "{}");
      const totalChaptersBefore = Object.values(prevProgress.completedChapters || {})
        .reduce((sum, arr) => sum + (arr?.length || 0), 0);

      const progress = { ...prevProgress };
      if (!progress.completedChapters) progress.completedChapters = {};
      if (!progress.completedChapters[book]) progress.completedChapters[book] = [];
      const wasCompleted = progress.completedChapters[book].includes(chapterNum);
      if (!wasCompleted) {
        progress.completedChapters[book].push(chapterNum);
      }
      const today = new Date().toISOString().split("T")[0];
      const prevStreak = progress.streak || 0;
      if (progress.lastReadDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        progress.streak = progress.lastReadDate === yesterday ? prevStreak + 1 : 1;
      }
      progress.lastReadDate = today;
      progress.lastRead = { book, chapter: chapterNum };
      localStorage.setItem("readingProgress", JSON.stringify(progress));
      syncReadingProgressUpdate(user?.id);

      // ---- Reading milestones → GHL (fire-and-forget, deduped client-side)
      if (user?.email) {
        const milestoneArgs = {
          email: user.email,
          name: profile?.name || user?.user_metadata?.name || "",
        };
        // First chapter ever read on this account/device
        if (totalChaptersBefore === 0 && !wasCompleted) {
          submitReadingMilestone({
            ...milestoneArgs,
            milestone: "first-chapter",
            detail: { book, chapter: chapterNum },
          });
        }
        // Whole book complete
        const bookMeta = getBook(book);
        if (bookMeta && progress.completedChapters[book].length >= bookMeta.chapters) {
          submitReadingMilestone({
            ...milestoneArgs,
            milestone: `book-complete:${book}`,
            detail: { book, chapters: bookMeta.chapters },
          });
        }
        // Streak thresholds
        for (const threshold of [7, 30, 100, 365]) {
          if (progress.streak === threshold && prevStreak < threshold) {
            submitReadingMilestone({
              ...milestoneArgs,
              milestone: `streak:${threshold}`,
              detail: { streak: progress.streak },
            });
          }
        }
      }
    } catch {}
  };

  const goTo = (target) => {
    if (!target) return;
    // Save scroll position before navigating away, then reset to top for new chapter
    if (scrollContainerRef.current) {
      sessionStorage.setItem(`scroll-${book}-${chapterNum}`, scrollContainerRef.current.scrollTop);
      scrollContainerRef.current.scrollTop = 0;
    }
    setSelectedVerse(null);
    setActiveChapterCtx({ book: target.book, chapter: target.chapter });
    setActiveWordInfo(null);
    setPendingWord(null);
    setWordStudyVerse(null);
    setLoadingVerse(null);
    clearWordStudy();
    saveProgress();
    navigatedDirectly.current = true;
    navigate(`/read/${encodeURIComponent(target.book)}/${target.chapter}`);
  };

  const handleVerseNumberTap = (verse, chapterBook, chapterChapter) => {
    setActiveWordInfo(null);
    setPendingWord(null);
    setSelectedVerse(verse);
    setActiveChapterCtx({ book: chapterBook || book, chapter: chapterChapter || chapterNum });
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
    <div className="flex h-[calc(100svh-3.5rem)]">
      {/* ─── Left: Scripture Reader ─── */}
      <div ref={scrollContainerRef} className="flex-1 min-w-0 overflow-y-auto" {...swipeHandlers}>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="sticky top-0 bg-cream/95 backdrop-blur-sm z-30 px-4 py-3 flex items-center justify-between">
            {/* Left: chapter nav + translation chip */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setShowNav(true)}
                className="flex items-center gap-2 min-h-[44px] min-w-0 text-left"
                aria-label={`Navigate — ${displayedChapter.book} chapter ${displayedChapter.chapter}`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-warm-brown-light leading-none truncate max-w-[140px]">
                    {displayedChapter.book}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xl font-bold text-warm-brown leading-none">
                      {displayedChapter.chapter}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-warm-brown-light shrink-0">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Translation chip — sits next to chapter name */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowTranslationPicker((v) => !v)}
                  className={`px-2 py-1 flex items-center gap-0.5 text-[11px] font-bold rounded-md transition-colors ${
                    showTranslationPicker
                      ? "bg-gold/10 text-gold"
                      : "bg-cream-dark text-warm-brown-light hover:text-warm-brown"
                  }`}
                  aria-label="Change Bible translation"
                  title="Change translation"
                >
                  {translation}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Translation picker — absolutely positioned below the chip */}
                {showTranslationPicker && (
                  <>
                    {/* Invisible backdrop to catch outside clicks */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowTranslationPicker(false)} />
                  </>
                )}
                {showTranslationPicker && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-cream-dark rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-up">
                    <p className="text-[10px] font-semibold text-warm-brown-light uppercase tracking-wider px-4 pt-3 pb-1">
                      Bible Translation
                    </p>
                    <div className="divide-y divide-cream-dark">
                      {TRANSLATIONS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTranslation(t.id);
                            setShowTranslationPicker(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                            translation === t.id
                              ? "bg-gold/5 text-gold"
                              : "text-warm-brown hover:bg-cream-dark/40"
                          }`}
                        >
                          <div>
                            <span className="text-sm font-semibold">{t.short}</span>
                            <span className="text-xs text-warm-brown-light ml-2">{t.name}</span>
                          </div>
                          {translation === t.id && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-gold shrink-0">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-warm-brown-light/60 px-4 py-2 border-t border-cream-dark leading-snug">
                      {getTranslation(translation).copyright}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Chapter bookmark toggle */}
              <button
                onClick={() => {
                  const b = displayedChapter.book, c = displayedChapter.chapter;
                  if (isBookmarked(b, c)) {
                    removeBookmark(b, c);
                    showToast("Bookmark removed", { icon: "🔖" });
                  } else {
                    addBookmark({ book: b, chapter: c });
                    showToast(`${b} ${c} bookmarked`, { icon: "🔖" });
                  }
                }}
                className={`w-[44px] h-[44px] flex items-center justify-center rounded-full transition-colors ${
                  isBookmarked(displayedChapter.book, displayedChapter.chapter)
                    ? "bg-gold/10 text-gold"
                    : "text-warm-brown-light hover:text-warm-brown"
                }`}
                aria-label={isBookmarked(displayedChapter.book, displayedChapter.chapter) ? "Remove chapter bookmark" : "Bookmark this chapter"}
                title="Bookmark chapter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                  fill={isBookmarked(displayedChapter.book, displayedChapter.chapter) ? "currentColor" : "none"}
                  stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>

              {/* Font size quick-adjust */}
              <div className="flex items-center bg-cream-dark rounded-full">
                <button
                  onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                  className="w-[44px] h-[44px] flex items-center justify-center text-xs text-warm-brown-light hover:text-warm-brown"
                  aria-label="Decrease font size"
                >A</button>
                <button
                  onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                  className="w-[44px] h-[44px] flex items-center justify-center text-sm font-medium text-warm-brown-light hover:text-warm-brown"
                  aria-label="Increase font size"
                >A</button>
              </div>

              {/* Verse numbers toggle */}
              <button
                onClick={toggleVerseNumbers}
                className={`w-[44px] h-[44px] flex items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  showVerseNumbers ? "bg-cream-dark text-warm-brown-light" : "bg-gold/10 text-gold"
                }`}
                title={showVerseNumbers ? "Hide verse numbers" : "Show verse numbers"}
                aria-label={showVerseNumbers ? "Hide verse numbers" : "Show verse numbers"}
              >
                <span className="text-[10px] font-bold leading-none">1:</span>
              </button>

              {/* Read / Study mode toggle — preserves scroll position */}
              <button
                onClick={() => toggleStudyMode()}
                className={`flex items-center gap-1 px-3 min-h-[44px] rounded-full text-xs font-medium transition-colors ${
                  studyMode
                    ? "bg-gold/10 text-gold"
                    : "bg-cream-dark text-warm-brown-light"
                }`}
                title={studyMode ? "Switch to Read mode" : "Switch to Study mode"}
              >
                {studyMode ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    Read
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Study
                  </>
                )}
              </button>

              {/* Toggle side panel (desktop only) */}
              <button
                onClick={() => setSidePanelOpen(!sidePanelOpen)}
                className="hidden md:flex items-center justify-center w-[44px] h-[44px] text-warm-brown-light hover:text-warm-brown transition-colors"
                aria-label={sidePanelOpen ? "Close study panel" : "Open study panel"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
              </button>
            </div>
            {/* Reading progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cream-dark">
              <div
                className="h-full bg-gold transition-[width] duration-150 ease-out"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </header>

          {/* Content */}
          {loading && <SkeletonVerses />}

          {error && (
            <div className="mx-4 mt-8 p-6 bg-cream rounded-2xl border border-cream-dark text-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mx-auto mb-3 text-warm-brown-light/50">
                {navigator.onLine ? (
                  <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
                ) : (
                  <><line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.56 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></>
                )}
              </svg>
              <p className="text-sm font-medium text-warm-brown mb-1">
                {navigator.onLine ? "Couldn't load this chapter" : "You're offline"}
              </p>
              <p className="text-xs text-warm-brown-light mb-4">
                {navigator.onLine
                  ? "There was a problem reaching the Bible text server."
                  : "Connect to the internet to load new chapters. Previously read chapters are available offline."}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {data && (
            <article aria-label={`${bookInfo?.name || book} chapter ${chapterNum}`}>
              {/* Sentinel for backward infinite scroll */}
              <div ref={topSentinelRef} className="h-1" />

              {/* Loading indicator for previous chapter */}
              {loadingPrev && (
                <div className="flex items-center justify-center py-6 gap-2">
                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-warm-brown-light">Loading previous chapter...</span>
                </div>
              )}

              {/* Prepended chapters (continuous scroll backward) */}
              {extraChaptersBefore.map((ch) => (
                <AppendedChapter
                  key={`${ch.book}-${ch.chapter}`}
                  chapterData={ch}
                  selectedVerse={activeChapterCtx.book === ch.book && activeChapterCtx.chapter === ch.chapter ? selectedVerse : null}
                  onVerseNumberTap={handleVerseNumberTap}
                  onWordTap={handleWordTap}
                />
              ))}

              <div data-chapter-ref={`${book}-${chapterNum}`}>
                {/* Show chapter divider when prepended chapters exist above */}
                {extraChaptersBefore.length > 0 && (
                  <div className="mx-4 mt-12 mb-4 bg-cream-dark rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-px bg-gold/30" />
                      <h2 className="text-sm font-bold text-warm-brown whitespace-nowrap">
                        {bookInfo?.name || book} {chapterNum}
                      </h2>
                      <div className="flex-1 h-px bg-gold/30" />
                    </div>
                    <div className="flex items-center justify-center gap-4 text-[10px]">
                      <span className="text-warm-brown-light/60">
                        {data.verses.length} verses
                      </span>
                    </div>
                  </div>
                )}
                <VerseList
                  verses={data.verses}
                  getHighlight={getHighlight}
                  getNote={getNote}
                  selectedVerse={activeChapterCtx.book === book && activeChapterCtx.chapter === chapterNum ? selectedVerse : null}
                  onVerseNumberTap={handleVerseNumberTap}
                  onWordTap={handleWordTap}
                  chapterWords={chapterWords}
                  book={book}
                  chapter={chapterNum}
                />
                {/* Translation copyright notice */}
                {getTranslation(translation).copyright && translation !== "KJV" && (
                  <p className="text-[10px] text-warm-brown-light/50 px-6 pb-2 leading-relaxed">
                    {getTranslation(translation).copyright}
                  </p>
                )}
                {/* Study tools for this chapter (parallel passages, audio, maps, YouTube) */}
                <Suspense fallback={null}>
                  <ChapterTools book={book} chapter={chapterNum} />
                </Suspense>
              </div>

              {/* Appended chapters (continuous scroll) */}
              {extraChapters.map((ch) => (
                <AppendedChapter
                  key={`${ch.book}-${ch.chapter}`}
                  chapterData={ch}
                  selectedVerse={activeChapterCtx.book === ch.book && activeChapterCtx.chapter === ch.chapter ? selectedVerse : null}
                  onVerseNumberTap={handleVerseNumberTap}
                  onWordTap={handleWordTap}
                />
              ))}

              {/* Sentinel for infinite scroll — triggers loading next chapter */}
              <div ref={sentinelRef} className="h-1" />

              {/* Loading indicator for next chapter */}
              {loadingNext && (
                <div className="flex items-center justify-center py-6 gap-2">
                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-warm-brown-light">Loading next chapter...</span>
                </div>
              )}

              {/* Chapter navigation */}
              <nav aria-label="Chapter navigation" className="flex items-center justify-between px-6 py-4">
                <button
                  onClick={() => goTo(prev)}
                  disabled={!prev}
                  className="flex items-center gap-1.5 text-sm text-warm-brown-light hover:text-warm-brown disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] px-3 rounded-lg hover:bg-cream-dark transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  {prev ? `${prev.book} ${prev.chapter}` : ""}
                </button>
                <button
                  onClick={() => goTo(next)}
                  disabled={!next}
                  className="flex items-center gap-1.5 text-sm text-warm-brown-light hover:text-warm-brown disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] px-3 rounded-lg hover:bg-cream-dark transition-colors"
                >
                  {next ? `${next.book} ${next.chapter}` : ""}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
              </nav>
            </article>
          )}
        </div>
      </div>

      {/* ─── Right: Side Panel (desktop only, resizable, available in both read and study modes) ─── */}
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
          <Suspense fallback={null}>
            <SidePanel
              book={book}
              chapter={chapterNum}
              notes={notes}
              activeWordInfo={activeWordInfo}
              onSaveNote={saveNote}
              onDeleteNote={deleteNote}
            />
          </Suspense>
        </div>
      )}

      {/* ─── Mobile overlays ─── */}

      {/* Verse action bar */}
      {selectedVerse && selectedVerseData && !showWordPanel && !showLoadingPanel && (
        <VerseActions
          verse={selectedVerse}
          verseText={selectedVerseData.text}
          book={activeChapterCtx.book}
          chapter={activeChapterCtx.chapter}
          currentHighlight={getHighlight(selectedVerse)}
          currentNote={getNote(selectedVerse)}
          isMemoryVerse={isMemoryVerse(activeChapterCtx.book, activeChapterCtx.chapter, selectedVerse)}
          isBookmarkedVerse={isBookmarked(activeChapterCtx.book, activeChapterCtx.chapter, selectedVerse)}
          onHighlight={addHighlight}
          onSaveNote={saveNote}
          onDeleteNote={deleteNote}
          onAddMemoryVerse={addVerse}
          onToggleBookmark={() => {
            const b = activeChapterCtx.book, c = activeChapterCtx.chapter;
            if (isBookmarked(b, c, selectedVerse)) {
              removeBookmark(b, c, selectedVerse);
              showToast("Bookmark removed");
            } else {
              addBookmark({ book: b, chapter: c, verse: selectedVerse, label: selectedVerseData.text?.slice(0, 80) || "" });
              showToast("Verse bookmarked");
            }
          }}
          onAddToJournal={() => {
            navigate(`/journal/new?book=${encodeURIComponent(activeChapterCtx.book)}&chapter=${activeChapterCtx.chapter}&verse=${selectedVerse}&text=${encodeURIComponent(selectedVerseData.text)}`);
          }}
          onShare={() => {
            setShareData({ content: selectedVerseData.text, reference: `${activeChapterCtx.book} ${activeChapterCtx.chapter}:${selectedVerse}` });
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
        <Suspense fallback={null}>
          <ShareSheet content={shareData.content} reference={shareData.reference} onClose={() => setShareData(null)} />
        </Suspense>
      )}

      {/* Chapter nav overlay */}
      {showNav && (
        <Suspense fallback={null}>
          <ChapterNav currentBook={book} currentChapter={chapterNum} onClose={() => setShowNav(false)} />
        </Suspense>
      )}

      {/* Scroll to top FAB */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed left-4 md:left-6 z-30 w-10 h-10 rounded-full bg-gold/90 text-white shadow-lg flex items-center justify-center hover:bg-gold transition-all duration-200 active:scale-90"
          style={{ bottom: "calc(53px + env(safe-area-inset-bottom, 0px) + 16px)" }}
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
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
