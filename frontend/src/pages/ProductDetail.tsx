import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import api, { type Product } from "@/lib/api";
import { useI18n, localized } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { StarRating } from "@/components/StarRating";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export default function ProductDetail() {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const { add } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [activeImg, setActiveImg] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    setLoading(true);
    setQty(1);
    setActiveImg(0);
    api
      .get(`/products/${slug}`)
      .then((r) => setProduct(r.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="container grid gap-8 py-10 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-xl bg-secondary" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-secondary" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-secondary" />
          <div className="h-24 animate-pulse rounded bg-secondary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container grid place-items-center py-24 text-center">
        <p className="mb-4 text-muted-foreground">{t("error_generic")}</p>
        <Link to="/shop">
          <Button>{t("nav_shop")}</Button>
        </Link>
      </div>
    );
  }

  const name = localized(product, lang);
  const desc =
    lang === "ar" && product.description_ar
      ? product.description_ar
      : product.description;
  const specs = product.technical_specs ?? {};

  async function submitReview() {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await api.post(`/products/${product!.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success(t("submit_review"));
      setReviewComment("");
      const r = await api.get(`/products/${slug}`);
      setProduct(r.data);
    } catch {
      toast.error(t("error_generic"));
    }
  }

  return (
    <div className="container py-8">
      {/* breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-accent">
          {t("nav_home")}
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-accent">
          {t("nav_shop")}
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              to={`/shop?category=${product.category.slug}`}
              className="hover:text-accent"
            >
              {localized(product.category, lang)}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        {/* gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border bg-secondary">
            {product.image_urls[activeImg] ? (
              <img
                src={product.image_urls[activeImg]}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-6xl">⚡</div>
            )}
          </div>
          {product.image_urls.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.image_urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    activeImg === i ? "border-accent" : "border-transparent"
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div className="animate-fade-up space-y-5">
          {product.brand && (
            <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </span>
          )}
          <h1 className="text-balance text-3xl font-bold leading-tight">{name}</h1>

          <div className="flex items-center gap-4">
            <StarRating value={product.rating_avg} count={product.rating_count} size={18} />
            {product.sku && (
              <span className="text-sm text-muted-foreground">
                {t("sku_label")}: {product.sku}
              </span>
            )}
          </div>

          <div className="flex items-end gap-3 ltr-nums">
            <span className="text-3xl font-extrabold text-foreground">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.compare_at_price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price, product.currency)}
                </span>
                <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                  -{product.discount_percent}% {t("off")}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            {product.in_stock ? (
              <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" /> {t("in_stock")} ({product.stock_quantity})
              </span>
            ) : (
              <span className="flex items-center gap-1 font-medium text-destructive">
                <X className="h-4 w-4" /> {t("out_of_stock")}
              </span>
            )}
          </div>

          {/* qty + actions */}
          {product.in_stock && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center rounded-lg border">
                <button
                  className="grid h-10 w-10 place-items-center hover:bg-secondary"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold ltr-nums">{qty}</span>
                <button
                  className="grid h-10 w-10 place-items-center hover:bg-secondary"
                  onClick={() =>
                    setQty((q) => Math.min(product.stock_quantity, q + 1))
                  }
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                size="lg"
                className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => {
                  add(product, qty);
                  toast.success(t("add_to_cart"), { description: name });
                }}
              >
                <ShoppingCart className="h-5 w-5" /> {t("add_to_cart")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  add(product, qty);
                  navigate("/cart");
                }}
              >
                {t("buy_now")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* tabs */}
      <div className="mt-12">
        <div className="flex gap-1 border-b">
          {[
            { id: "desc", label: t("description") },
            { id: "specs", label: t("specifications") },
            { id: "reviews", label: `${t("reviews")} (${product.rating_count})` },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id as typeof tab)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium ${
                tab === tb.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {tab === "desc" && (
            <p className="max-w-2xl leading-relaxed text-foreground/90">
              {desc || t("no_products")}
            </p>
          )}

          {tab === "specs" && (
            <div className="max-w-xl overflow-hidden rounded-xl border">
              {Object.entries(specs).map(([k, v], i) => (
                <div
                  key={k}
                  className={`grid grid-cols-2 gap-4 px-4 py-3 text-sm ${
                    i % 2 === 0 ? "bg-secondary/40" : ""
                  }`}
                >
                  <span className="font-medium text-muted-foreground">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
              {Object.keys(specs).length === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground">—</p>
              )}
            </div>
          )}

          {tab === "reviews" && (
            <div className="max-w-2xl space-y-6">
              {/* write review */}
              <div className="rounded-xl border bg-card p-4">
                <h4 className="mb-3 font-semibold">{t("write_review")}</h4>
                <StarRating
                  value={reviewRating}
                  size={22}
                  onChange={setReviewRating}
                />
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
                  placeholder="..."
                />
                <Button
                  className="mt-3 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={submitReview}
                >
                  {t("submit_review")}
                </Button>
              </div>

              {/* list */}
              {product.reviews && product.reviews.length > 0 ? (
                <div className="space-y-4">
                  {product.reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold">{r.user_name}</span>
                        <StarRating value={r.rating} />
                      </div>
                      {r.comment && (
                        <p className="text-sm text-foreground/80">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("no_reviews")}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* related */}
      {product.related && product.related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 text-xl font-bold">{t("related_products")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {product.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
