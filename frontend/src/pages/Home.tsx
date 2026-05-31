import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Headphones,
  Truck,
  Wallet,
} from "lucide-react";
import api, { type Category, type Product } from "@/lib/api";
import { useI18n, localized } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { CategoryIcon } from "@/lib/categoryIcons";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { t, lang, dir } = useI18n();
  useDocumentTitle(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingFeat, setLoadingFeat] = useState(true);

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data))
      .finally(() => setLoadingCats(false));
    api
      .get("/products", { params: { featured: "true", per_page: 8 } })
      .then((r) => setFeatured(r.data.products))
      .finally(() => setLoadingFeat(false));
  }, []);

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  const features = [
    { icon: Truck, title: t("feat_shipping"), desc: t("feat_shipping_d") },
    { icon: BadgeCheck, title: t("feat_genuine"), desc: t("feat_genuine_d") },
    { icon: Wallet, title: t("feat_cod"), desc: t("feat_cod_d") },
    { icon: Headphones, title: t("feat_support"), desc: t("feat_support_d") },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="electric-gradient relative overflow-hidden text-primary-foreground">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="container relative grid gap-8 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center gap-6">
            <span className="w-fit animate-fade-up rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent [animation-delay:0ms]">
              {t("tagline")}
            </span>
            <h1 className="animate-fade-up text-balance text-4xl font-extrabold leading-tight [animation-delay:80ms] md:text-5xl">
              {t("hero_title")}
            </h1>
            <p className="max-w-md animate-fade-up text-lg text-primary-foreground/80 [animation-delay:160ms]">
              {t("hero_subtitle")}
            </p>
            <div className="flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
              <Link to="/shop">
                <Button
                  size="lg"
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 amber-glow"
                >
                  {t("hero_cta")}
                  <ArrowIcon className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/track">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                >
                  {t("nav_track")}
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden items-center justify-center md:flex">
            <img
              src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=700&q=80"
              alt="electronics"
              fetchPriority="high"
              className="max-h-80 animate-float rounded-2xl object-cover shadow-2xl ring-1 ring-white/10"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container -mt-8 relative z-10">
        <div className="grid gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("shop_categories")}</h2>
          <Link
            to="/shop"
            className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            {t("view_all")} <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {loadingCats
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-3 rounded-xl border bg-card p-5"
                >
                  <div className="skeleton h-14 w-14 rounded-full" />
                  <div className="skeleton h-3 w-16 rounded" />
                  <div className="skeleton h-2.5 w-10 rounded" />
                </div>
              ))
            : categories.map((c, i) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.slug}`}
              style={{ animationDelay: `${i * 50}ms` }}
              className="group flex animate-fade-up flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center transition-all duration-300 hover-lift hover:border-accent hover:bg-accent/5 hover:shadow-md"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <CategoryIcon name={c.icon} />
              </span>
              <span className="text-sm font-semibold leading-tight">
                {localized(c, lang)}
              </span>
              <span className="text-xs text-muted-foreground">
                {c.product_count} {lang === "ar" ? "منتج" : "items"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-secondary/40 py-14">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t("featured")}</h2>
            <Link
              to="/shop"
              className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              {t("view_all")} <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {loadingFeat
              ? Array.from({ length: 8 }).map((_, i) => (
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
                ))
              : featured.map((p, i) => (
              <div
                key={p.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us banner */}
      <section className="container py-14">
        <div className="electric-gradient flex flex-col items-center gap-4 rounded-2xl px-6 py-10 text-center text-primary-foreground">
          <h2 className="text-2xl font-bold">{t("why_us")}</h2>
          <p className="max-w-xl text-primary-foreground/80">
            {t("hero_subtitle")}
          </p>
          <Link to="/shop">
            <Button
              size="lg"
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {t("hero_cta")} <ArrowIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
