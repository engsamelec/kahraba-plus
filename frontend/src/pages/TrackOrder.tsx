import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Circle, PackageSearch } from "lucide-react";
import api, { type Order } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";

const STEPS = ["pending", "processing", "shipped", "delivered"];

export default function TrackOrder() {
  const { t } = useI18n();
  const money = useMoney();
  useDocumentTitle(t("track_title"));
  const [searchParams] = useSearchParams();
  const [number, setNumber] = useState(searchParams.get("order") || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function track(orderNumber: string) {
    if (!orderNumber) return;
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get(`/orders/track/${orderNumber}`);
      setOrder(data);
    } catch {
      setOrder(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (searchParams.get("order")) track(searchParams.get("order")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = order
    ? order.status === "cancelled"
      ? -1
      : STEPS.indexOf(order.status)
    : -1;

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8 text-center">
        <PackageSearch className="mx-auto mb-3 h-12 w-12 text-accent" />
        <h1 className="text-2xl font-bold">{t("track_title")}</h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          track(number);
        }}
        className="flex gap-2"
      >
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder={t("track_placeholder")}
          className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {t("track_btn")}
        </Button>
      </form>

      {error && (
        <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
          {t("order_not_found")}
        </p>
      )}

      {order && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("order_number")}
                </span>
                <p className="font-mono font-bold text-accent">
                  {order.order_number}
                </p>
              </div>
              <span className="text-lg font-bold ltr-nums">
                {money(order.total_amount)}
              </span>
            </div>

            {/* progress */}
            {currentStep === -1 ? (
              <p className="rounded-lg bg-destructive/10 p-3 text-center text-sm font-semibold text-destructive">
                {t("status_cancelled")}
              </p>
            ) : (
              <div className="flex items-center justify-between">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      <div
                        className={`h-0.5 flex-1 ${
                          i === 0
                            ? "bg-transparent"
                            : i <= currentStep
                              ? "bg-accent"
                              : "bg-border"
                        }`}
                      />
                      {i <= currentStep ? (
                        <CheckCircle2 className="h-6 w-6 shrink-0 text-accent" />
                      ) : (
                        <Circle className="h-6 w-6 shrink-0 text-border" />
                      )}
                      <div
                        className={`h-0.5 flex-1 ${
                          i === STEPS.length - 1
                            ? "bg-transparent"
                            : i < currentStep
                              ? "bg-accent"
                              : "bg-border"
                        }`}
                      />
                    </div>
                    <span
                      className={`mt-2 text-center text-[11px] font-medium ${
                        i <= currentStep ? "text-accent" : "text-muted-foreground"
                      }`}
                    >
                      {t(`status_${step}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-3 font-semibold">{t("order_summary")}</h3>
            <div className="space-y-2 text-sm">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>
                    {it.product_name} × {it.quantity}
                  </span>
                  <span className="ltr-nums font-semibold">
                    {money(it.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
