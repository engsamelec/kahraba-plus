import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useI18n, localized } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function Cart() {
  const { t, lang } = useI18n();
  const { items, subtotal, setQuantity, remove } = useCart();
  useDocumentTitle(t("cart_title"));

  if (items.length === 0) {
    return (
      <div className="container grid place-items-center py-24 text-center">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="mb-2 text-xl font-bold">{t("cart_empty")}</h2>
        <Link to="/shop" className="mt-2">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            {t("cart_empty_cta")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("cart_title")}</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        {/* items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((line) => {
            const name = localized(line.product, lang);
            return (
              <div
                key={line.product.id}
                className="flex gap-4 rounded-xl border bg-card p-4"
              >
                <Link
                  to={`/product/${line.product.slug}`}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary"
                >
                  {line.product.image_urls[0] && (
                    <img
                      src={line.product.image_urls[0]}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link
                    to={`/product/${line.product.slug}`}
                    className="line-clamp-2 text-sm font-semibold hover:text-accent"
                  >
                    {name}
                  </Link>
                  <span className="text-sm text-muted-foreground ltr-nums">
                    {formatPrice(line.product.price, line.product.currency)}
                  </span>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-lg border">
                      <button
                        className="grid h-8 w-8 place-items-center hover:bg-secondary"
                        onClick={() =>
                          setQuantity(line.product.id, line.quantity - 1)
                        }
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold ltr-nums">
                        {line.quantity}
                      </span>
                      <button
                        className="grid h-8 w-8 place-items-center hover:bg-secondary"
                        onClick={() =>
                          setQuantity(line.product.id, line.quantity + 1)
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(line.product.id)}
                      className="flex items-center gap-1 text-xs text-destructive hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {t("remove")}
                    </button>
                  </div>
                </div>
                <div className="shrink-0 text-end font-bold ltr-nums">
                  {formatPrice(line.product.price * line.quantity, line.product.currency)}
                </div>
              </div>
            );
          })}
        </div>

        {/* summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 rounded-xl border bg-card p-6">
            <h3 className="mb-4 font-bold">{t("order_summary")}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-semibold ltr-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span className="text-xs text-muted-foreground">
                  {t("calc_at_checkout")}
                </span>
              </div>
            </div>
            <div className="my-4 border-t" />
            <div className="flex justify-between text-lg font-bold">
              <span>{t("total")}</span>
              <span className="ltr-nums">{formatPrice(subtotal)}</span>
            </div>
            <Link to="/checkout">
              <Button className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {t("checkout")}
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline" className="mt-2 w-full">
                {t("continue_shopping")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
