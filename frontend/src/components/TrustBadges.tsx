import { BadgeCheck, Lock, RotateCcw, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Reassurance row shown near the checkout CTA to reduce purchase anxiety. */
export function TrustBadges() {
  const { t } = useI18n();
  const items = [
    { icon: Lock, label: t("trust_secure") },
    { icon: Truck, label: t("trust_cod") },
    { icon: BadgeCheck, label: t("trust_genuine") },
    { icon: RotateCcw, label: t("trust_returns") },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center gap-2 rounded-lg border bg-card/50 px-2.5 py-2 text-xs text-muted-foreground"
        >
          <it.icon className="h-4 w-4 shrink-0 text-accent" />
          <span className="leading-tight">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
