import { lazy, Suspense } from "react";

const ParallelPassages = lazy(() => import("./ParallelPassages"));

/**
 * Study tools shown at the bottom of each chapter.
 * Maps & video teachings have been removed — commentary and translation
 * compare now live in the study side panel.
 */
export default function ChapterTools({ book, chapter }) {
  return (
    <div className="mt-6">
      <Suspense fallback={null}>
        <ParallelPassages book={book} chapter={chapter} />
      </Suspense>
    </div>
  );
}
