import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import api, { type Product, type Promotion } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ProductCard } from "@/components/ProductCard";

// Pick the localized title/subtitle of a promotion for the current language.
function promoText(p: Promotion, lang: string, field: "title" | "subtitle") {
  if (lang === "ar") return p[`${field}_ar`] || p[field] || "";
  if (lang === "he") return p[`${field}_he`] || p[field] || "";
  return p[field] || "";
}

export default function Offers() {
  const { t, lang } = useI18n();
  useDocumentTitle(t("offers_title"));
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/promotions").then((r) => setPromos(r.data)).catch(() => {}),
      api
        .get("/products", { params: { sale: "true", per_page: 60 } })
        .then((r) => setProducts(r.data.products))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Tag className="h-6 w-6 text-accent" />
        {t("offers_title")}
      </h1>

      {/* active occasions */}
      {promos.length > 0 && (
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {promos.map((p) => (
            <div
              key={p.id}
              className="electric-gradient relative overflow-hidden rounded-2xl p-6 text-primary-foreground"
            >
              <div className="hero-aurora" />
              <div className="relative">
                <h2 className="text-xl font-extrabold">
                  {promoText(p, lang, "title")}
                </h2>
                {promoText(p, lang, "subtitle") && (
                  <p className="mt-1 text-sm text-primary-foreground/80">
                    {promoText(p, lang, "subtitle")}
                  </p>
                )}
                {p.coupon_code && (
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(p.coupon_code!);
                      toast.success(t("offers_code_copied"));
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-accent/60 bg-accent/15 px-3 py-1.5 text-sm font-bold text-accent"
                  >
                    <Tag className="h-4 w-4" />
                    {p.coupon_code}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* discounted products */}
      <h2 className="mb-4 text-lg font-bold">{t("offers_products")}</h2>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <div className="skeleton aspect-square w-full" />
              <div className="space-y-2 p-3">
                <div className="skeleton h-4 w-4/5 rounded" />
                <div className="skeleton h-5 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          {t("offers_none")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
