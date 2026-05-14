import { useCallback } from "react";
import useHighlights from "../../hooks/useHighlights";
import useNotes from "../../hooks/useNotes";
import useChapterWordStudy from "../../hooks/useChapterWordStudy";
import { getBook } from "../../data/bibleBooks";
import VerseList from "./VerseList";

/**
 * Renders an appended chapter in continuous scroll mode.
 * Each instance manages its own highlights/notes/word-study hooks
 * so that all existing features (highlight, note icons, study mode) work.
 */
export default function AppendedChapter({
  chapterData,
  selectedVerse,
  onVerseNumberTap,
  onWordTap,
}) {
  const { book, chapter, verses } = chapterData;
  const bookInfo = getBook(book);

  const { getHighlight } = useHighlights(book, chapter);
  const { getNote } = useNotes(book, chapter);
  const { verseWords: chapterWords } = useChapterWordStudy(book, chapter, verses);

  // Wrap tap handler to inject this chapter's book/chapter context
  const handleVerseNumberTap = useCallback(
    (verse) => onVerseNumberTap(verse, book, chapter),
    [onVerseNumberTap, book, chapter]
  );

  return (
    <div data-chapter-ref={`${book}-${chapter}`}>
      {/* Chapter boundary divider */}
      <div className="mx-4 mt-12 mb-4 bg-cream-dark rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-px bg-gold/30" />
          <h2 className="text-sm font-bold text-warm-brown whitespace-nowrap">
            {bookInfo?.name || book} {chapter}
          </h2>
          <div className="flex-1 h-px bg-gold/30" />
        </div>
        <div className="flex items-center justify-center gap-4 text-[10px]">
          <a href={`/read/${encodeURIComponent(book)}/${chapter}`} className="text-gold hover:text-gold/80 font-medium">
            Open chapter
          </a>
          <span className="text-warm-brown-light/30">|</span>
          <span className="text-warm-brown-light/60">
            {verses.length} verses
          </span>
        </div>
      </div>

      <VerseList
        verses={verses}
        getHighlight={getHighlight}
        getNote={getNote}
        selectedVerse={selectedVerse}
        onVerseNumberTap={handleVerseNumberTap}
        onWordTap={onWordTap}
        chapterWords={chapterWords}
        book={book}
        chapter={chapter}
      />
    </div>
  );
}
