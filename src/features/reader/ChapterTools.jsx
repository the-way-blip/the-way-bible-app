import { lazy, Suspense } from "react";

const BibleMaps = lazy(() => import("./BibleMaps"));
const YouTubeLinks = lazy(() => import("./YouTubeLinks"));
const AudioBible = lazy(() => import("./AudioBible"));
const ParallelPassages = lazy(() => import("./ParallelPassages"));

/**
 * Study tools shown at the bottom of EACH chapter (Parallel passages,
 * audio Bible, maps, YouTube). Rendering this per-chapter (rather than
 * once at the bottom of the infinite-scroll feed) prevents the visual
 * "glitch" where tools flashed in between chapters as new ones loaded.
 */
export default function ChapterTools({ book, chapter }) {
  return (
    <div className="mt-6">
      <Suspense fallback={null}>
        <ParallelPassages book={book} chapter={chapter} />
        <AudioBible book={book} chapter={chapter} />
        <BibleMaps book={book} />
        <YouTubeLinks book={book} chapter={chapter} />
      </Suspense>
    </div>
  );
}
