import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/api";
import { useI18n, localized } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";

/**
 * "Frequently bought together": the current product plus suggested companions.
 * The shopper can deselect items; the total updates and "add selected" adds
 * them all to the cart at once — a classic basket-size booster.
 */
export function FrequentlyBought({ items }: { items: Product[] }) {
  const { t, lang } = useI18n();
  const { add } = useCart();
  const money = useMoney();
  const [selected, setSelected] = useState<Record<number, boolean>>(
    Object.fromEntries(items.map((p) => [p.id, true]))
  );

  const chosen = items.filter((p) => selected[p.id] && p.in_stock);
  const total = chosen.reduce((sum, p) => sum + p.price, 0);

  function addAll() {
    chosen.forEach((p) => add(p, 1));
    toast.success(t("fbt_added"), {
      description: `${chosen.length} ${t("items_count")}`,
    });
  }

  return (
    <section className="mt-12 rounded-2xl border bg-card p-5">
      <h2 className="mb-4 text-lg font-bold">{t("fbt_title")}</h2>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {items.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              {i > 0 && <Plus className="h-4 w-4 text-muted-foreground" />}
              <label className="relative block cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selected[p.id]}
                  disabled={!p.in_stock}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, [p.id]: e.target.checked }))
                  }
                  className="peer sr-only"
                />
                <div className="w-28 overflow-hidden rounded-xl border-2 border-transparent opacity-60 transition peer-checked:border-accent peer-checked:opacity-100">
                  <Link to={`/product/${p.slug}`}>
                    <div className="aspect-square bg-secondary">
                      {p.image_urls[0] ? (
                        <img
                          src={p.image_urls[0]}
                          alt={localized(p, lang)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-2xl text-accent/40">
                          ⚡
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-1.5">
                    <p className="line-clamp-1 text-[11px] font-medium">
                      {localized(p, lang)}
                    </p>
                    <p className="text-xs font-bold ltr-nums">{money(p.price)}</p>
                  </div>
                </div>
                {/* checkbox dot */}
                <span className="absolute top-1 ltr:right-1 rtl:left-1 grid h-5 w-5 place-items-center rounded-full border bg-background text-accent peer-checked:bg-accent peer-checked:text-accent-foreground">
                  ✓
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="shrink-0 lg:w-48 lg:text-end">
          <p className="text-sm text-muted-foreground">
            {t("fbt_total")} ({chosen.length})
          </p>
          <p className="mb-2 text-2xl font-extrabold ltr-nums">{money(total)}</p>
          <Button
            onClick={addAll}
            disabled={chosen.length === 0}
            className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <ShoppingCart className="h-4 w-4" />
            {t("fbt_add")}
          </Button>
        </div>
      </div>
    </section>
  );
}
