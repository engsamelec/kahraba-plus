import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BatteryCharging, Sun, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface Appliance {
  id: number;
  watts: string;
  hours: string;
}

/**
 * Solar system sizing helper — a practical tool for an electronics store.
 * Estimates the panel wattage, battery capacity and charge-controller rating
 * from the customer's daily load. Uses common engineering rules of thumb
 * (sun hours, system losses, depth of discharge) — clearly an estimate.
 */
export default function SolarCalculator() {
  const { t, lang } = useI18n();
  useDocumentTitle(t("solar_title"));

  const [rows, setRows] = useState<Appliance[]>([
    { id: 1, watts: "60", hours: "5" },
  ]);
  const [sunHours, setSunHours] = useState("5");
  const [voltage, setVoltage] = useState("12");
  const [autonomy, setAutonomy] = useState("1");

  function update(id: number, key: "watts" | "hours", value: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, { id: Date.now(), watts: "", hours: "" }]);
  }
  function removeRow(id: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  }

  const result = useMemo(() => {
    const wh = rows.reduce(
      (sum, r) => sum + (Number(r.watts) || 0) * (Number(r.hours) || 0),
      0
    );
    const sh = Math.max(1, Number(sunHours) || 5);
    const v = Number(voltage) || 12;
    const days = Math.max(1, Number(autonomy) || 1);
    // System efficiency ~75%; battery usable depth of discharge ~50%.
    const panelW = Math.ceil((wh / sh / 0.75) / 10) * 10;
    const batteryWh = (wh * days) / 0.5;
    const batteryAh = Math.ceil(batteryWh / v / 5) * 5;
    // Controller amps = panel watts / system voltage, +25% margin.
    const controllerA = Math.ceil((panelW / v) * 1.25);
    return { wh: Math.round(wh), panelW, batteryAh, controllerA };
  }, [rows, sunHours, voltage, autonomy]);

  const inputCls =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6 text-center">
        <Sun className="mx-auto mb-2 h-10 w-10 text-accent" />
        <h1 className="text-2xl font-bold">{t("solar_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("solar_hint")}</p>
      </div>

      {/* appliances */}
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="mb-3 font-semibold">{t("solar_loads")}</h2>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <input
                inputMode="numeric"
                placeholder={t("solar_watts")}
                className={inputCls}
                value={r.watts}
                onChange={(e) => update(r.id, "watts", e.target.value)}
              />
              <span className="text-muted-foreground">×</span>
              <input
                inputMode="numeric"
                placeholder={t("solar_hours")}
                className={inputCls}
                value={r.hours}
                onChange={(e) => update(r.id, "hours", e.target.value)}
              />
              <button
                onClick={() => removeRow(r.id)}
                className="shrink-0 px-2 text-muted-foreground hover:text-destructive"
                aria-label={t("remove")}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addRow}
          className="mt-3 text-sm font-medium text-accent hover:underline"
        >
          + {t("solar_add_load")}
        </button>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t("solar_sun_hours")}
            </span>
            <input
              inputMode="decimal"
              className={inputCls}
              value={sunHours}
              onChange={(e) => setSunHours(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t("solar_voltage")}
            </span>
            <select
              className={inputCls}
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
            >
              <option value="12">12V</option>
              <option value="24">24V</option>
              <option value="48">48V</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t("solar_autonomy")}
            </span>
            <input
              inputMode="numeric"
              className={inputCls}
              value={autonomy}
              onChange={(e) => setAutonomy(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* results */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultCard
          icon={Sun}
          label={t("solar_panel")}
          value={`${result.panelW} W`}
        />
        <ResultCard
          icon={BatteryCharging}
          label={t("solar_battery")}
          value={`${result.batteryAh} Ah`}
        />
        <ResultCard
          icon={Zap}
          label={t("solar_controller")}
          value={`${result.controllerA} A`}
        />
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground ltr-nums">
        {t("solar_daily")}: {result.wh} Wh/{lang === "en" ? "day" : "يوم"}
      </p>

      <div className="mt-5 text-center">
        <Link
          to="/shop?category=solar-energy"
          className="text-sm font-medium text-accent hover:underline"
        >
          {t("solar_shop")} →
        </Link>
      </div>

      <p className="mt-4 rounded-lg bg-secondary/50 p-3 text-center text-xs text-muted-foreground">
        {t("solar_disclaimer")}
      </p>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 text-center">
      <Icon className="mx-auto mb-2 h-7 w-7 text-accent" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold ltr-nums">{value}</p>
    </div>
  );
}
