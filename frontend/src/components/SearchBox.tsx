import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, Search } from "lucide-react";
import api, { type Product } from "@/lib/api";
import { useI18n, localized } from "@/lib/i18n";
import { useMoney } from "@/lib/currency";

/**
 * Storefront search with live autocomplete: debounced suggestions show
 * matching products (thumbnail, name, price) as the customer types. Enter goes
 * to the full results page; clicking a suggestion opens that product.
 */
export function SearchBox({
  className = "",
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const { t, lang } = useI18n();
  const money = useMoney();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced suggestion fetch.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = setTimeout(() => {
      api
        .get("/products", { params: { search: query, per_page: 6 } })
        .then((r) => {
          setResults(r.data.products);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(to: string) {
    setOpen(false);
    setQ("");
    onNavigate?.();
    navigate(to);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) go(`/shop?search=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form onSubmit={submit} className="relative">
        <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={t("search_placeholder")}
          aria-label={t("search_placeholder")}
          className="w-full rounded-full border bg-secondary/60 py-2 ltr:pl-10 ltr:pr-11 rtl:pr-10 rtl:pl-11 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        {loading ? (
          <Loader2 className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <button
            type="button"
            onClick={() => go("/visual-search")}
            title={t("visual_search")}
            aria-label={t("visual_search")}
            className="absolute top-1/2 -translate-y-1/2 ltr:right-2 rtl:left-2 grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent/15 hover:text-accent"
          >
            <Camera className="h-4 w-4" />
          </button>
        )}
      </form>

      {open && q.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border bg-popover py-1 shadow-xl">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {t("search_no_results")}
            </p>
          ) : (
            <>
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go(`/product/${p.slug}`)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-start hover:bg-secondary"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary">
                    {p.image_urls?.[0] ? (
                      <img
                        src={p.image_urls[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "⚡"
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {localized(p, lang)}
                    </span>
                    <span className="block text-xs text-accent ltr-nums">
                      {money(p.price)}
                    </span>
                  </span>
                </button>
              ))}
              <button
                onClick={() => go(`/shop?search=${encodeURIComponent(q.trim())}`)}
                className="mt-1 block w-full border-t px-4 py-2 text-center text-xs font-medium text-accent hover:bg-secondary"
              >
                {t("search_view_all")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
