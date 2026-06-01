import { Link, useLocation } from "react-router-dom";
import { GitCompare, X } from "lucide-react";
import { useI18n, localized } from "@/lib/i18n";
import { useCompare } from "@/lib/compare";
import { Button } from "@/components/ui/button";

/**
 * Sticky bar that appears once the shopper selects products to compare.
 * Hidden on the compare page itself. Sits above the mobile tab bar.
 */
export function CompareBar() {
  const { t, lang } = useI18n();
  const { items, remove, clear, count } = useCompare();
  const { pathname } = useLocation();

  if (count === 0 || pathname === "/compare") return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 lg:bottom-0">
      <div className="container">
        <div className="mb-2 flex items-center gap-3 rounded-xl border bg-card/95 p-2 shadow-lg backdrop-blur lg:mb-3">
          <span className="hidden shrink-0 items-center gap-1.5 ps-2 text-sm font-semibold sm:flex">
            <GitCompare className="h-4 w-4 text-accent" />
            {t("compare")}
          </span>
          <div className="flex flex-1 gap-2 overflow-x-auto">
            {items.map((p) => (
              <div
                key={p.id}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-secondary"
              >
                {p.image_urls[0] ? (
                  <img
                    src={p.image_urls[0]}
                    alt={localized(p, lang)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-accent/50">
                    ⚡
                  </span>
                )}
                <button
                  onClick={() => remove(p.id)}
                  aria-label={t("remove")}
                  className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={clear}
            className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
          >
            {t("clear")}
          </button>
          <Link to="/compare" className="shrink-0">
            <Button
              size="sm"
              disabled={count < 2}
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <GitCompare className="h-4 w-4" />
              {t("compare")} ({count})
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
