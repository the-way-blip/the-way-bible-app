import { useMemo, useState } from "react";
import useT from "../../hooks/useT";
import PresentMode from "../../components/PresentMode";
import { passageSlides, slideIndexForVerse } from "../../utils/presentSlides";

/**
 * Reader → Present mode for the chapter on screen. One verse per slide by
 * default; 2 or 3 short verses can share a slide. Uses the verses the reader
 * already loaded (no refetch). Starts at the selected verse when there is one.
 */
export default function PresentPassage({ verses, book, chapter, translation, startVerse, onClose }) {
  const t = useT();
  const [perSlide, setPerSlide] = useState(1);
  const slides = useMemo(
    () => passageSlides(verses, { book, chapter, translation, perSlide }),
    [verses, book, chapter, translation, perSlide]
  );
  const [startIndex] = useState(() => slideIndexForVerse(slides, startVerse));

  return (
    <PresentMode
      slides={slides}
      startIndex={startIndex}
      title={`${book} ${chapter}`}
      onClose={onClose}
      density={{ value: perSlide, options: [1, 2, 3], onChange: setPerSlide, label: t("present.perSlide", "Verses per slide") }}
    />
  );
}
