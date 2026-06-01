import { Link } from "react-router-dom";
import { useI18n, localized } from "@/lib/i18n";
import { useMoney } from "@/lib/currency";
import { getRecentlyViewed } from "@/lib/recentlyViewed";

/** Horizontal strip of recently-viewed products to re-engage the shopper. */
export function RecentlyViewed({
  excludeId,
  bare = false,
}: {
  excludeId?: number;
  bare?: boolean;
}) {
  const { t, lang } = useI18n();
  const money = useMoney();
  const items = getRecentlyViewed(excludeId);

  if (items.length === 0) return null;

  return (
    <section className={bare ? "py-10" : "container py-10"}>
      <h2 className="mb-4 text-xl font-bold">{t("recently_viewed")}</h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.slug}`}
            className="group w-36 shrink-0"
          >
            <div className="aspect-square overflow-hidden rounded-lg border bg-secondary">
              {p.image_urls[0] ? (
                <img
                  src={p.image_urls[0]}
                  alt={localized(p, lang)}
                  loading="lazy"
                  className="card-media h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-2xl text-muted-foreground">
                  ⚡
                </div>
              )}
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-snug group-hover:text-accent">
              {localized(p, lang)}
            </p>
            <p className="text-sm font-bold ltr-nums">{money(p.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
