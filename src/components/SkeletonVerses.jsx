const VERSE_LINES = [
  { lines: [95, 80, 60] },
  { lines: [100, 70] },
  { lines: [90, 85, 45] },
  { lines: [75, 100, 55] },
  { lines: [100, 65] },
  { lines: [85, 90, 70] },
  { lines: [100, 50] },
  { lines: [70, 95, 80] },
  { lines: [90, 60] },
  { lines: [100, 85, 40] },
];

export default function SkeletonVerses() {
  return (
    <div className="px-6 py-4 space-y-5" aria-hidden="true">
      {VERSE_LINES.map((verse, i) => (
        <div key={i} className="flex gap-2 animate-pulse">
          {/* Verse number circle */}
          <div className="shrink-0 w-5 h-5 rounded-full bg-cream-dark mt-1" />
          {/* Text lines */}
          <div className="flex-1 space-y-2 pt-0.5">
            {verse.lines.map((width, j) => (
              <div
                key={j}
                className="h-3.5 bg-cream-dark rounded"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
