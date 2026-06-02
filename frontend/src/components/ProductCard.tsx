import { Link } from "react-router-dom";
import { useState } from "react";
import { GitCompare, Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/api";
import { useI18n, localized } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { useCompare } from "@/lib/compare";
import { useMoney } from "@/lib/currency";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";

export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useI18n();
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const { has: inCompare, toggle: toggleCompare, full: compareFull } = useCompare();
  const money = useMoney();
  const name = localized(product, lang);
  const [imgError, setImgError] = useState(false);
  const fav = isFavorite(product.id);
  const comparing = inCompare(product.id);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg">
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-secondary">
        {product.image_urls[0] && !imgError ? (
          <>
            {!imgLoaded && <div className="skeleton absolute inset-0" />}
            <img
              src={product.image_urls[0]}
              alt={name}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              onLoad={() => setImgLoaded(true)}
              className={`card-media h-full w-full object-cover transition-opacity duration-500 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-secondary to-secondary/50 text-4xl text-accent/40">
            ⚡
          </div>
        )}
        <div className="absolute top-2 ltr:left-2 rtl:right-2 flex flex-col items-start gap-1">
          {product.is_bestseller && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              ★ {t("bestseller")}
            </span>
          )}
          {product.discount_percent > 0 && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
              -{product.discount_percent}%
            </span>
          )}
          {product.low_stock && product.in_stock && (
            <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              {t("low_stock_left")}
            </span>
          )}
        </div>
        {!product.in_stock && (
          <span className="absolute inset-0 grid place-items-center bg-background/70 text-sm font-semibold">
            {t("out_of_stock")}
          </span>
        )}
      </Link>

      <div className="absolute top-2 ltr:right-2 rtl:left-2 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          aria-label={fav ? t("remove_favorite") : t("add_favorite")}
          aria-pressed={fav}
          onClick={(e) => {
            e.preventDefault();
            toggle(product.id);
            toast.success(fav ? t("removed_favorite") : t("added_favorite"), {
              description: name,
            });
          }}
          className="grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              fav
                ? "fill-destructive text-destructive"
                : "text-muted-foreground"
            }`}
          />
        </button>
        <button
          type="button"
          aria-label={t("compare_add")}
          aria-pressed={comparing}
          disabled={!comparing && compareFull}
          onClick={(e) => {
            e.preventDefault();
            toggleCompare(product);
          }}
          className="grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur disabled:opacity-40"
        >
          <GitCompare
            className={`h-4 w-4 transition-colors ${
              comparing ? "text-accent" : "text-muted-foreground"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {product.brand && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </span>
        )}
        <Link
          to={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-semibold leading-snug hover:text-accent"
        >
          {name}
        </Link>

        {product.rating_count > 0 && (
          <StarRating value={product.rating_avg} count={product.rating_count} />
        )}

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="ltr-nums">
            <span className="text-lg font-bold text-foreground">
              {money(product.price)}
            </span>
            {!!product.discount_percent && product.discount_percent > 0 && (
              <span className="ms-1.5 text-xs text-muted-foreground line-through">
                {money(product.compare_at_price!)}
              </span>
            )}
          </div>
          <Button
            size="icon"
            aria-label={t("add_to_cart")}
            className="h-9 w-9 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40"
            disabled={!product.in_stock}
            onClick={() => {
              add(product);
              toast.success(t("add_to_cart"), { description: name });
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
