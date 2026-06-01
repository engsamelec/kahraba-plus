import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import api, { type Order } from "@/lib/api";
import { useI18n, localizedOrderItem } from "@/lib/i18n";
import { useMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const { t, lang } = useI18n();
  const money = useMoney();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    api
      .get(`/orders/track/${orderNumber}`)
      .then((r) => setOrder(r.data))
      .catch(() => setOrder(null));
  }, [orderNumber]);

  return (
    <div className="container max-w-xl py-16 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-20 w-20 text-green-500" />
      <h1 className="mb-2 text-3xl font-bold">{t("order_placed")}</h1>
      <p className="mb-6 text-muted-foreground">{t("order_placed_d")}</p>

      <div className="rounded-xl border bg-card p-6 text-start">
        <div className="mb-4 flex items-center justify-between border-b pb-4">
          <span className="text-sm text-muted-foreground">{t("order_number")}</span>
          <span className="font-mono text-lg font-bold text-accent">
            {orderNumber}
          </span>
        </div>
        {order && (
          <>
            <div className="space-y-2 text-sm">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>
                    {localizedOrderItem(it, lang)} × {it.quantity}
                  </span>
                  <span className="ltr-nums font-semibold">
                    {money(it.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
              <span>{t("total")}</span>
              <span className="ltr-nums">{money(order.total_amount)}</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link to={`/track?order=${orderNumber}`}>
          <Button variant="outline">{t("nav_track")}</Button>
        </Link>
        <Link to="/shop">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            {t("continue_shopping")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
