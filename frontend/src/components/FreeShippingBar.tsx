import { Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useConfig } from "@/lib/config";
import { useMoney } from "@/lib/currency";

/**
 * Free-shipping progress bar. `subtotalUsd` is the cart subtotal in USD (the
 * base currency); the threshold comes from the backend store config, so this
 * is always truthful — never a made-up number.
 */
export function FreeShippingBar({ subtotalUsd }: { subtotalUsd: number }) {
  const { t } = useI18n();
  const { free_shipping_threshold } = useConfig();
  const money = useMoney();

  if (!free_shipping_threshold || free_shipping_threshold <= 0) return null;

  const remaining = Math.max(0, free_shipping_threshold - subtotalUsd);
  const pct = Math.min(100, (subtotalUsd / free_shipping_threshold) * 100);
  const unlocked = remaining <= 0;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <Truck className={`h-4 w-4 ${unlocked ? "text-green-600 dark:text-green-400" : "text-accent"}`} />
        {unlocked ? (
          <span className="font-medium text-green-600 dark:text-green-400">
            {t("free_ship_unlocked")} 🎉
          </span>
        ) : (
          <span>
            {t("free_ship_add")}{" "}
            <b className="ltr-nums text-accent">{money(remaining)}</b>{" "}
            {t("free_ship_get")}
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            unlocked ? "bg-green-500" : "bg-accent"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
