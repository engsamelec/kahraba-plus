import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/api";
import { useI18n, localized } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";

export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useI18n();
  const { add } = useCart();
  const name = localized(product, lang);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover-lift hover:border-accent/40 hover:shadow-xl">
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-secondary">
        {product.image_urls[0] ? (
          <img
            src={product.image_urls[0]}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            ⚡
          </div>
        )}
        {product.discount_percent > 0 && (
          <span className="absolute top-2 ltr:left-2 rtl:right-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
            -{product.discount_percent}%
          </span>
        )}
        {!product.in_stock && (
          <span className="absolute inset-0 grid place-items-center bg-background/70 text-sm font-semibold">
            {t("out_of_stock")}
          </span>
        )}
      </Link>

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
              {formatPrice(product.price, product.currency)}
            </span>
            {product.compare_at_price && (
              <span className="ms-1.5 text-xs text-muted-foreground line-through">
                {formatPrice(product.compare_at_price, product.currency)}
              </span>
            )}
          </div>
          <Button
            size="icon"
            aria-label={t("add_to_cart")}
            className="h-9 w-9 rounded-full bg-accent text-accent-foreground transition-transform hover:bg-accent/90 hover:scale-110 active:scale-95 disabled:opacity-40"
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
