import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * Floating "scroll to top" button that fades in once the user has scrolled
 * past a threshold. Sits clear of the mobile tab bar (and compare bar).
 */
export function ScrollToTopButton() {
  const { t } = useI18n();
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
      aria-label={t("scroll_top")}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-32 ltr:right-4 rtl:left-4 z-30 grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg transition-opacity hover:bg-accent/90 lg:bottom-6"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
