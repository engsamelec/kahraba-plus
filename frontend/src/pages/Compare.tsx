import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, GitCompare, X } from "lucide-react";
import api from "@/lib/api";
import { useI18n, localized } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useCompare } from "@/lib/compare";
import { useMoney } from "@/lib/currency";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";

export default function Compare() {
  const { t, lang } = useI18n();
  const money = useMoney();
  useDocumentTitle(t("compare"));
  const { items, remove, clear } = useCompare();

  // The product list endpoint omits technical_specs; fetch them per product
  // (by slug) so the spec rows are populated for comparison.
  const [specsById, setSpecsById] = useState<Record<number, Record<string, string>>>({});
  useEffect(() => {
    items.forEach((p) => {
      if (p.technical_specs && Object.keys(p.technical_specs).length) return;
      if (specsById[p.id]) return;
      api
        .get(`/products/${p.slug}`)
        .then((r) => {
          const specs = r.data?.technical_specs ?? {};
          setSpecsById((prev) => ({ ...prev, [p.id]: specs }));
        })
        .catch(() => {});
    });
  }, [items, specsById]);

  const specsFor = (p: (typeof items)[number]): Record<string, string> =>
    p.technical_specs && Object.keys(p.technical_specs).length
      ? p.technical_specs
      : specsById[p.id] ?? {};

  if (items.length === 0) {
    return (
      <div className="container grid place-items-center py-24 text-center">
        <GitCompare className="mb-3 h-12 w-12 text-muted-foreground/30" />
        <p className="mb-4 text-muted-foreground">{t("compare_empty")}</p>
        <Link to="/shop">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            {t("nav_shop")}
          </Button>
        </Link>
      </div>
    );
  }

  // Union of every spec key across the compared products, preserving the
  // order in which keys first appear.
  const specKeys: string[] = [];
  for (const p of items) {
    for (const k of Object.keys(specsFor(p))) {
      if (!specKeys.includes(k)) specKeys.push(k);
    }
  }

  // Highlight the cheapest product in the price row.
  const minPrice = Math.min(...items.map((p) => p.price));

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <GitCompare className="h-6 w-6 text-accent" />
          {t("compare")}
        </h1>
        <button
          onClick={clear}
          className="text-sm text-muted-foreground hover:text-destructive"
        >
          {t("clear")}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-32 p-2" />
              {items.map((p) => (
                <th key={p.id} className="p-2 align-top">
                  <div className="relative rounded-xl border bg-card p-3 text-center">
                    <button
                      onClick={() => remove(p.id)}
                      aria-label={t("remove")}
                      className="absolute ltr:right-1 rtl:left-1 top-1 grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <Link to={`/product/${p.slug}`}>
                      <div className="mx-auto mb-2 grid h-24 w-24 place-items-center overflow-hidden rounded-lg bg-secondary">
                        {p.image_urls[0] ? (
                          <img
                            src={p.image_urls[0]}
                            alt={localized(p, lang)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-accent/50">⚡</span>
                        )}
                      </div>
                      <span className="line-clamp-2 text-xs font-semibold leading-snug hover:text-accent">
                        {localized(p, lang)}
                      </span>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* price */}
            <tr className="border-t">
              <td className="p-2 font-medium text-muted-foreground">
                {t("subtotal")}
              </td>
              {items.map((p) => (
                <td key={p.id} className="p-2 text-center ltr-nums">
                  <span
                    className={`font-bold ${
                      p.price === minPrice
                        ? "text-green-600 dark:text-green-400"
                        : ""
                    }`}
                  >
                    {money(p.price)}
                  </span>
                  {p.price === minPrice && items.length > 1 && (
                    <span className="ms-1 text-[10px] text-green-600 dark:text-green-400">
                      ✓ {t("compare_cheapest")}
                    </span>
                  )}
                </td>
              ))}
            </tr>
            {/* brand */}
            <tr className="border-t bg-secondary/30">
              <td className="p-2 font-medium text-muted-foreground">
                {t("brand_label")}
              </td>
              {items.map((p) => (
                <td key={p.id} className="p-2 text-center">
                  {p.brand || "—"}
                </td>
              ))}
            </tr>
            {/* rating */}
            <tr className="border-t">
              <td className="p-2 font-medium text-muted-foreground">
                {t("reviews")}
              </td>
              {items.map((p) => (
                <td key={p.id} className="p-2">
                  <div className="flex justify-center">
                    <StarRating value={p.rating_avg} count={p.rating_count} />
                  </div>
                </td>
              ))}
            </tr>
            {/* availability */}
            <tr className="border-t bg-secondary/30">
              <td className="p-2 font-medium text-muted-foreground">
                {t("in_stock")}
              </td>
              {items.map((p) => (
                <td key={p.id} className="p-2 text-center">
                  {p.in_stock ? (
                    <Check className="mx-auto h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <X className="mx-auto h-4 w-4 text-destructive" />
                  )}
                </td>
              ))}
            </tr>
            {/* spec rows */}
            {specKeys.map((key, i) => (
              <tr
                key={key}
                className={`border-t ${i % 2 ? "bg-secondary/30" : ""}`}
              >
                <td className="p-2 font-medium text-muted-foreground">{key}</td>
                {items.map((p) => {
                  const val = specsFor(p)[key];
                  return (
                    <td
                      key={p.id}
                      className={`p-2 text-center ${
                        val ? "" : "text-muted-foreground/40"
                      }`}
                    >
                      {val || "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* CTA row */}
            <tr className="border-t">
              <td className="p-2" />
              {items.map((p) => (
                <td key={p.id} className="p-2 text-center">
                  <Link to={`/product/${p.slug}`}>
                    <Button
                      size="sm"
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {t("view_all")}
                    </Button>
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
