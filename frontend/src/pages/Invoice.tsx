import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Printer } from "lucide-react";
import api, { type Order } from "@/lib/api";
import { useI18n, localizedOrderItem } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMoney } from "@/lib/currency";
import { useConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";

/**
 * Printable invoice / receipt for an order. Looked up by order number (public,
 * same as tracking). The print stylesheet (index.css `@media print`) hides the
 * site chrome so only the invoice prints.
 */
export default function Invoice() {
  const { orderNumber } = useParams();
  const { t, lang } = useI18n();
  const money = useMoney();
  const cfg = useConfig();
  useDocumentTitle(`${t("invoice")} ${orderNumber ?? ""}`);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/orders/track/${orderNumber}`)
      .then((r) => setOrder(r.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="container grid place-items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="container grid place-items-center py-24 text-center">
        <p className="mb-4 text-muted-foreground">{t("order_not_found")}</p>
        <Link to="/track">
          <Button>{t("track_title")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      {/* actions (hidden when printing) */}
      <div className="mb-6 flex justify-end gap-2 print:hidden">
        <Button onClick={() => window.print()} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
          <Printer className="h-4 w-4" />
          {t("invoice_print")}
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-8 print:border-0 print:p-0">
        {/* header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                ⚡
              </span>
              <span className="text-xl font-extrabold">{t("brand")}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {cfg.store_email} · {cfg.store_address}
            </p>
          </div>
          <div className="text-end">
            <h1 className="text-2xl font-bold">{t("invoice")}</h1>
            <p className="font-mono text-sm text-accent">{order.order_number}</p>
            <p className="text-xs text-muted-foreground ltr-nums">
              {order.created_at?.slice(0, 10)}
            </p>
          </div>
        </div>

        {/* bill to */}
        <div className="mb-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 font-semibold text-muted-foreground">
              {t("invoice_billed_to")}
            </p>
            <p className="font-medium">{order.customer_name}</p>
            <p>{order.customer_email}</p>
            {order.customer_phone && <p className="ltr-nums">{order.customer_phone}</p>}
            <p>
              {order.shipping_address}, {order.shipping_city},{" "}
              {order.shipping_country}
            </p>
          </div>
          <div className="sm:text-end">
            <p className="mb-1 font-semibold text-muted-foreground">{t("status")}</p>
            <p>{t(`status_${order.status}`)}</p>
            <p className="mt-2 mb-1 font-semibold text-muted-foreground">
              {t("payment_method")}
            </p>
            <p>{order.payment_method === "cod" ? t("pay_cod") : t("pay_card")}</p>
          </div>
        </div>

        {/* items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2 text-start font-medium">{t("nav_shop")}</th>
              <th className="py-2 text-center font-medium">{t("quantity")}</th>
              <th className="py-2 text-end font-medium">{t("subtotal")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-b">
                <td className="py-2">{localizedOrderItem(it, lang)}</td>
                <td className="py-2 text-center ltr-nums">{it.quantity}</td>
                <td className="py-2 text-end ltr-nums">{money(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* totals */}
        <div className="mt-4 ltr:ml-auto rtl:mr-auto w-full max-w-xs space-y-1 text-sm">
          <Row label={t("subtotal")} value={money(order.subtotal)} />
          {order.discount && order.discount > 0 ? (
            <Row
              label={`${t("discount")}${order.coupon_code ? ` (${order.coupon_code})` : ""}`}
              value={`−${money(order.discount)}`}
              tone="text-green-600 dark:text-green-400"
            />
          ) : null}
          <Row
            label={t("shipping")}
            value={order.shipping_cost === 0 ? t("free") : money(order.shipping_cost)}
          />
          {order.tax > 0 && <Row label={t("tax")} value={money(order.tax)} />}
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
            <span>{t("total")}</span>
            <span className="ltr-nums">{money(order.total_amount)}</span>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {t("invoice_thanks")}
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone = "",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className={`flex justify-between ${tone}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="ltr-nums">{value}</span>
    </div>
  );
}
