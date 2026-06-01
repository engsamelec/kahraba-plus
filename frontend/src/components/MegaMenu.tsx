import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import api, { type Category } from "@/lib/api";
import { useI18n, localized } from "@/lib/i18n";
import { CategoryIcon } from "@/lib/categoryIcons";

/**
 * Desktop categories mega-menu: a hover/focus dropdown panel listing every
 * category with its icon and product count — the standard catalog-navigation
 * pattern on large electronics stores.
 */
export function MegaMenu() {
  const { t, lang } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data))
      .catch(() => {});
    return () => window.clearTimeout(closeTimer.current);
  }, []);

  if (categories.length === 0) return null;

  function openNow() {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function closeSoon() {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          open
            ? "bg-accent/10 text-accent"
            : "text-foreground/80 hover:bg-secondary hover:text-foreground"
        }`}
      >
        {t("nav_categories")}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 w-[34rem] max-w-[90vw] ltr:left-0 rtl:right-0 rounded-xl border bg-popover p-3 shadow-xl">
          <div className="grid grid-cols-2 gap-1">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/shop?category=${c.slug}`}
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-secondary"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <CategoryIcon name={c.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {localized(c, lang)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {c.product_count} {t("items_count")}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <Link
            to="/shop"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-lg bg-secondary/60 py-2 text-center text-sm font-medium text-accent hover:bg-secondary"
          >
            {t("view_all")}
          </Link>
        </div>
      )}
    </div>
  );
}
