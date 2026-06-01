import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  FileText,
  ImageOff,
  Loader2,
  PackageX,
  Tag,
} from "lucide-react";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface Brief {
  id: number;
  name: string;
  slug: string;
}
interface Health {
  total: number;
  complete: number;
  score: number;
  issue_count: number;
  missing_image: Brief[];
  missing_price: Brief[];
  missing_description: Brief[];
  missing_category: Brief[];
  out_of_stock: Brief[];
}

interface Demand {
  product_id: number;
  product_name: string;
  slug: string;
  in_stock: boolean;
  requests: number;
}

export function CatalogHealth() {
  const { t } = useI18n();
  const [data, setData] = useState<Health | null>(null);
  const [demand, setDemand] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/catalog-health")
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
    api
      .get("/admin/stock-notifications")
      .then((r) => setDemand(r.data))
      .catch(() => {});
  }, []);

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin text-accent" />;
  }
  if (!data) return null;

  const groups = [
    { key: "missing_image", icon: ImageOff, items: data.missing_image, label: t("health_no_image") },
    { key: "missing_price", icon: Tag, items: data.missing_price, label: t("health_no_price") },
    { key: "missing_description", icon: FileText, items: data.missing_description, label: t("health_no_desc") },
    { key: "missing_category", icon: Tag, items: data.missing_category, label: t("health_no_category") },
    { key: "out_of_stock", icon: PackageX, items: data.out_of_stock, label: t("health_out_of_stock") },
  ];

  const scoreColor =
    data.score >= 90
      ? "text-green-600 dark:text-green-400"
      : data.score >= 60
        ? "text-amber-500"
        : "text-destructive";

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
        <div className={`text-4xl font-extrabold ltr-nums ${scoreColor}`}>
          {data.score}%
        </div>
        <div className="text-sm">
          <p className="font-semibold">{t("health_title")}</p>
          <p className="text-muted-foreground ltr-nums">
            {data.complete}/{data.total} {t("health_complete")}
          </p>
        </div>
      </div>

      {data.issue_count === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          {t("health_all_good")}
        </div>
      ) : (
        <div className="space-y-4">
          {groups
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <div key={g.key} className="rounded-xl border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <g.icon className="h-4 w-4 text-amber-500" />
                  {g.label}
                  <span className="ltr-nums text-muted-foreground">
                    ({g.items.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.items.slice(0, 30).map((p) => (
                    <Link
                      key={p.id}
                      to={`/product/${p.slug}`}
                      className="rounded-full border px-3 py-1 text-xs hover:border-accent hover:text-accent"
                    >
                      {p.name}
                    </Link>
                  ))}
                  {g.items.length > 30 && (
                    <span className="px-2 py-1 text-xs text-muted-foreground">
                      +{g.items.length - 30}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {data.issue_count > 0 && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("health_hint")}
        </p>
      )}

      {demand.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <BellRing className="h-4 w-4 text-accent" />
            {t("demand_title")}
          </div>
          <div className="space-y-2">
            {demand.map((d) => (
              <div
                key={d.product_id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <Link
                  to={`/product/${d.slug}`}
                  className="line-clamp-1 hover:text-accent"
                >
                  {d.product_name}
                </Link>
                <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent ltr-nums">
                  {d.requests} {t("demand_waiting")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
