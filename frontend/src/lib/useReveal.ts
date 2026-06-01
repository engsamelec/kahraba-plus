import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal hook (IntersectionObserver). Returns a ref to attach to an
 * element and a boolean that flips to true once the element scrolls into view.
 * One-shot by default — the reveal doesn't replay on scroll back.
 *
 * Pairs with the `.reveal` / `.reveal-show` CSS in index.css. Honors
 * prefers-reduced-motion (the CSS shows content immediately in that case).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {}
) {
  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } =
    options;
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // If IntersectionObserver is unavailable, just show.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setShown(false);
          }
        });
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, shown };
}
