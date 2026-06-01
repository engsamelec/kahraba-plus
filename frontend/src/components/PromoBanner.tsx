import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Tag } from "lucide-react";
import api, { type Promotion } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

function text(p: Promotion, lang: string, field: "title" | "subtitle") {
  if (lang === "ar") return p[`${field}_ar`] || p[field] || "";
  if (lang === "he") return p[`${field}_he`] || p[field] || "";
  return p[field] || "";
}

/** Top live promotion shown as a slim banner on the home page. */
export function PromoBanner() {
  const { t, lang, dir } = useI18n();
  const [promo, setPromo] = useState<Promotion | null>(null);

  useEffect(() => {
    api
      .get("/promotions")
      .then((r) => setPromo(r.data[0] ?? null))
      .catch(() => {});
  }, []);

  if (!promo) return null;
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <Link
      to={promo.cta_link || "/offers"}
      className="group block bg-accent text-accent-foreground"
    >
      <div className="container flex items-center justify-center gap-3 py-2.5 text-sm font-semibold">
        <Tag className="h-4 w-4 shrink-0" />
        <span>{text(promo, lang, "title")}</span>
        {text(promo, lang, "subtitle") && (
          <span className="hidden font-normal opacity-80 sm:inline">
            — {text(promo, lang, "subtitle")}
          </span>
        )}
        {promo.coupon_code && (
          <span className="rounded border border-dashed border-accent-foreground/50 px-1.5 text-xs">
            {promo.coupon_code}
          </span>
        )}
        <span className="inline-flex items-center gap-1 underline-offset-2 group-hover:underline">
          {t("offers_shop")} <Arrow className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
