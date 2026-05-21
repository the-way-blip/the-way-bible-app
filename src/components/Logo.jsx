/**
 * Reusable wordmark/logo component.
 * Swaps between dark and light variants for light/dark mode.
 *
 * Usage:
 *   <Logo className="h-8" />        // standard size
 *   <Logo className="h-10" />       // larger
 *   <Logo className="h-12 mx-auto" />
 */
export default function Logo({ className = "h-8", alt = "The Way" }) {
  return (
    <>
      <img
        src="/Logo%20Black.png"
        alt={alt}
        className={`${className} w-auto dark:hidden`}
        draggable={false}
      />
      <img
        src="/Logo%20White.png"
        alt={alt}
        className={`${className} w-auto hidden dark:block`}
        draggable={false}
      />
    </>
  );
}
