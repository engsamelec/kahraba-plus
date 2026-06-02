import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Config {
  free_shipping_threshold: number | string;
  domestic_shipping: number | string;
  international_shipping: number | string;
  tax_rate: number | string;
  home_country: string;
}

export function SettingsAdmin() {
  const { t } = useI18n();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/config").then((r) => setCfg(r.data));
  }, []);

  async function save() {
    if (!cfg) return;
    setSaving(true);
    try {
      await api.put("/admin/config", {
        free_shipping_threshold: Number(cfg.free_shipping_threshold),
        domestic_shipping: Number(cfg.domestic_shipping),
        international_shipping: Number(cfg.international_shipping),
        tax_rate: Number(cfg.tax_rate),
        home_country: cfg.home_country,
      });
      toast.success(t("save"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setSaving(false);
    }
  }

  if (!cfg) return <Loader2 className="h-6 w-6 animate-spin text-accent" />;

  const cell =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent";
  const fields: {
    key: keyof Config;
    label: string;
    hint?: string;
    step?: string;
  }[] = [
    { key: "free_shipping_threshold", label: t("cfg_free_shipping"), hint: "$", step: "0.5" },
    { key: "domestic_shipping", label: t("cfg_domestic"), hint: "$", step: "0.5" },
    { key: "international_shipping", label: t("cfg_intl"), hint: "$", step: "0.5" },
    { key: "tax_rate", label: t("cfg_tax"), hint: "0–1", step: "0.01" },
    { key: "home_country", label: t("cfg_home_country") },
  ];

  return (
    <div className="max-w-md space-y-4">
      <div>
        <h2 className="text-lg font-bold">{t("admin_settings")}</h2>
        <p className="text-sm text-muted-foreground">{t("cfg_hint")}</p>
      </div>
      <div className="space-y-3 rounded-xl border bg-card p-4">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm font-medium">
              {f.label}
              {f.hint && (
                <span className="ms-1 text-xs text-muted-foreground ltr-nums">
                  ({f.hint})
                </span>
              )}
            </span>
            <input
              type={f.key === "home_country" ? "text" : "number"}
              step={f.step}
              dir={f.key === "home_country" ? undefined : "ltr"}
              className={cell}
              value={cfg[f.key]}
              onChange={(e) => setCfg({ ...cfg, [f.key]: e.target.value })}
            />
          </label>
        ))}
        <Button
          onClick={save}
          disabled={saving}
          className="w-full gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
