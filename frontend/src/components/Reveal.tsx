import type { ReactNode } from "react";
import { useReveal } from "@/lib/useReveal";

type Direction = "up" | "down" | "left" | "right" | "none";

/**
 * Wraps content and reveals it with a subtle slide+fade when it scrolls into
 * view — the signature feel of polished marketing sites. `delay` (ms) staggers
 * siblings. Respects prefers-reduced-motion via the CSS.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      data-dir={direction}
      className={`reveal ${shown ? "reveal-show" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
