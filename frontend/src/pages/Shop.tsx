import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import api, { type Category, type Product } from "@/lib/api";
import { useI18n, localized } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

const PER_PAGE = 12;

export default function Shop() {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";
  const inStock = searchParams.get("in_stock") === "true";
  const maxPrice = searchParams.get("max_price") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = {
      per_page: PER_PAGE,
      page,
      sort,
    };
    if (category) params.category = category;
    if (search) params.search = search;
    if (inStock) params.in_stock = "true";
    if (maxPrice) params.max_price = maxPrice;

    api
      .get("/products", { params })
      .then((r) => {
        setProducts(r.data.products);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .finally(() => setLoading(false));
  }, [category, search, sort, inStock, maxPrice, page]);

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  }

  const activeFilters = useMemo(
    () => [category, search, inStock ? "stock" : "", maxPrice].filter(Boolean).length,
    [category, search, inStock, maxPrice]
  );

  const heading = search
    ? `${t("nav_shop")}: "${search}"`
    : category
      ? localized(
          categories.find((c) => c.slug === category) ?? {
            name: t("nav_shop"),
            name_ar: t("nav_shop"),
          },
          lang
        )
      : t("nav_shop");

  const FilterPanel = (
    <div className="space-y-6">
      {/* categories */}
      <div>
        <h4 className="mb-2 text-sm font-semibold">{t("nav_categories")}</h4>
        <div className="space-y-1">
          <button
            onClick={() => update("category", null)}
            className={`block w-full rounded-md px-3 py-1.5 text-start text-sm ${
              !category ? "bg-accent/15 font-semibold text-accent" : "hover:bg-secondary"
            }`}
          >
            {t("all_categories")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => update("category", c.slug)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-start text-sm ${
                category === c.slug
                  ? "bg-accent/15 font-semibold text-accent"
                  : "hover:bg-secondary"
              }`}
            >
              <span>{localized(c, lang)}</span>
              <span className="text-xs text-muted-foreground">
                {c.product_count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* price */}
      <div>
        <h4 className="mb-2 text-sm font-semibold">{t("price_range")}</h4>
        <input
          type="range"
          min={0}
          max={200}
          step={5}
          value={maxPrice || 200}
          onChange={(e) => update("max_price", e.target.value)}
          className="w-full accent-[hsl(var(--accent))]"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground ltr-nums">
          <span>$0</span>
          <span>${maxPrice || 200}+</span>
        </div>
      </div>

      {/* in stock */}
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => update("in_stock", e.target.checked ? "true" : null)}
          className="h-4 w-4 accent-[hsl(var(--accent))]"
        />
        {t("in_stock_only")}
      </label>

      {activeFilters > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1"
          onClick={() => setSearchParams(new URLSearchParams())}
        >
          <X className="h-3.5 w-3.5" /> {t("clear_filters")}
        </Button>
      )}
    </div>
  );

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{heading}</h1>
          <p className="text-sm text-muted-foreground">
            {total} {t("results")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => update("sort", e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="newest">{t("sort_newest")}</option>
            <option value="price_asc">{t("sort_price_asc")}</option>
            <option value="price_desc">{t("sort_price_desc")}</option>
            <option value="rating">{t("sort_rating")}</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 lg:hidden"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("filters")}
            {activeFilters > 0 && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] text-accent-foreground">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-28 rounded-xl border bg-card p-5">
            {FilterPanel}
          </div>
        </aside>

        {/* mobile filters */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowFilters(false)}
            />
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 w-80 max-w-[85%] overflow-y-auto bg-background p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">{t("filters")}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {FilterPanel}
            </div>
          </div>
        )}

        {/* grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border bg-card"
                >
                  <div className="skeleton aspect-square w-full" />
                  <div className="space-y-2 p-3">
                    <div className="skeleton h-3 w-1/3 rounded" />
                    <div className="skeleton h-4 w-4/5 rounded" />
                    <div className="skeleton h-5 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed py-24 text-center">
              <p className="text-muted-foreground">{t("no_products")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {products.map((p, i) => (
                  <div
                    key={p.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              {pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1">
                  {Array.from({ length: pages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={page === i + 1 ? "default" : "outline"}
                      size="icon"
                      className={
                        page === i + 1
                          ? "h-9 w-9 bg-accent text-accent-foreground hover:bg-accent/90"
                          : "h-9 w-9"
                      }
                      onClick={() => update("page", String(i + 1))}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
