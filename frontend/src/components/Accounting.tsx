import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
// Admin sees the store's base currency (USD), like the rest of the panel.
import { formatPrice } from "@/lib/format";

interface ProdProfit {
  name: string;
  profit: number;
  revenue: number;
  qty: number;
}
interface Accounting {
  revenue: number;
  cogs: number;
  gross_profit: number;
  margin_percent: number;
  discounts: number;
  shipping_collected: number;
  order_count: number;
  aov: number;
  items_with_cost: number;
  items_without_cost: number;
  products_missing_cost: number;
  top_profit: ProdProfit[];
  low_profit: ProdProfit[];
}

export function Accounting() {
  const { t } = useI18n();
  const [data, setData] = useState<Accounting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/accounting")
      .then((r) => setData(r.data))
      .catch((err) => toast.error(getErrorMessage(err) ?? t("error_generic")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-accent" />;
  if (!data) return null;

  const cards = [
    { label: t("acc_revenue"), value: formatPrice(data.revenue), tone: "" },
    { label: t("acc_cogs"), value: formatPrice(data.cogs), tone: "text-muted-foreground" },
    {
      label: t("acc_gross_profit"),
      value: formatPrice(data.gross_profit),
      tone: data.gross_profit >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive",
    },
    {
      label: t("acc_margin"),
      value: `${data.margin_percent}%`,
      tone: "text-accent",
    },
    { label: t("acc_aov"), value: formatPrice(data.aov), tone: "" },
    { label: t("acc_discounts"), value: formatPrice(data.discounts), tone: "text-muted-foreground" },
  ];

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold">{t("acc_title")}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`mt-1 text-xl font-bold ltr-nums ${c.tone}`}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {data.products_missing_cost > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>
            {t("acc_missing_cost").replace(
              "{n}",
              String(data.products_missing_cost)
            )}
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* most profitable */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            {t("acc_top_profit")}
          </h3>
          <ProfitList rows={data.top_profit} />
        </div>
        {/* least profitable */}
        {data.low_profit.length > 0 && (
          <div className="rounded-xl border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
              <TrendingDown className="h-4 w-4 text-destructive" />
              {t("acc_low_profit")}
            </h3>
            <ProfitList rows={data.low_profit} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProfitList({ rows }: { rows: ProdProfit[] }) {
  const { t } = useI18n();
  if (rows.length === 0)
    return <p className="text-xs text-muted-foreground">{t("no_data")}</p>;
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between gap-2 text-sm">
          <span className="line-clamp-1">{r.name}</span>
          <span
            className={`shrink-0 font-semibold ltr-nums ${
              r.profit >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-destructive"
            }`}
          >
            {formatPrice(r.profit)}
          </span>
        </div>
      ))}
    </div>
  );
}
