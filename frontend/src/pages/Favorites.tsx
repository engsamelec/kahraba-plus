import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import api, { type Product } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useFavorites } from "@/lib/favorites";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export default function Favorites() {
  const { t } = useI18n();
  const { ids } = useFavorites();
  useDocumentTitle(t("favorites"));
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get("/products", { params: { ids: ids.join(","), per_page: 100 } })
      .then((r) => setProducts(r.data.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [ids]);

  return (
    <div className="container py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Heart className="h-6 w-6 fill-destructive text-destructive" />
        {t("favorites")}
        {ids.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground ltr-nums">
            ({ids.length})
          </span>
        )}
      </h1>

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
        <div className="grid place-items-center rounded-xl border border-dashed py-24 text-center">
          <Heart className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="mb-4 text-muted-foreground">{t("no_favorites")}</p>
          <Link to="/shop">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              {t("nav_shop")}
            </Button>
          </Link>
        </div>
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
