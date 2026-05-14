export default function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-cream-dark p-4 animate-pulse">
          <div className="flex items-start justify-between mb-2">
            <div className="h-4 bg-cream-dark rounded w-2/5" />
            <div className="h-3 bg-cream-dark rounded w-16" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-cream-dark rounded w-full" />
            <div className="h-3 bg-cream-dark rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
