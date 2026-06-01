import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Floating "scroll to top" button that fades in once the user has scrolled
 * past a threshold. Sits above the mobile tab bar on small screens.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-20 ltr:right-4 rtl:left-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg transition-opacity hover:bg-accent/90 lg:bottom-6"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
