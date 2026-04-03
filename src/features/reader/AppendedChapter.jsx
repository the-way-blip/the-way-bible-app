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
      {/* Chapter divider */}
      <div className="flex items-center gap-3 px-5 pt-8 pb-3">
        <div className="flex-1 h-px bg-warm-brown/10" />
        <span className="text-sm font-semibold text-warm-brown/60 whitespace-nowrap">
          {bookInfo?.name || book} {chapter}
        </span>
        <div className="flex-1 h-px bg-warm-brown/10" />
      </div>

      <VerseList
        verses={verses}
        getHighlight={getHighlight}
        getNote={getNote}
        selectedVerse={selectedVerse}
        onVerseNumberTap={handleVerseNumberTap}
        onWordTap={onWordTap}
        chapterWords={chapterWords}
      />
    </div>
  );
}
