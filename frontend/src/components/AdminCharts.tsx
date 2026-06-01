import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";

export interface SalesPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
}

const ACCENT = "hsl(38 92% 50%)";
const BAR_COLORS = [
  "hsl(38 92% 50%)",
  "hsl(38 92% 58%)",
  "hsl(38 80% 64%)",
  "hsl(222 47% 40%)",
  "hsl(222 30% 55%)",
];

/** Short month/day label, direction-stable. */
function dayLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function AdminCharts({
  sales,
  top,
}: {
  sales: SalesPoint[];
  top: TopProduct[];
}) {
  const { t, lang } = useI18n();
  const hasSales = sales.some((s) => s.orders > 0 || s.revenue > 0);

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      {/* revenue area — spans 2 cols on desktop */}
      <div className="rounded-xl border bg-card p-5 lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold">
          {lang === "ar" ? "المبيعات (آخر 14 يوم)" : "Sales (last 14 days)"}
        </h3>
        {hasSales ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={sales} margin={{ left: -16, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={dayLabel}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "hsl(var(--popover-foreground))",
                }}
                labelFormatter={(v) => dayLabel(String(v))}
                formatter={(value: number, name) => [
                  name === "revenue" ? formatPrice(value) : value,
                  name === "revenue" ? t("total_revenue") : t("total_orders"),
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#revFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="grid h-[240px] place-items-center text-sm text-muted-foreground">
            {lang === "ar" ? "لا توجد مبيعات بعد" : "No sales yet"}
          </p>
        )}
      </div>

      {/* top products */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold">
          {lang === "ar" ? "الأكثر مبيعاً" : "Top products"}
        </h3>
        {top.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={top}
              layout="vertical"
              margin={{ left: 8, right: 8 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) =>
                  v.length > 14 ? v.slice(0, 13) + "…" : v
                }
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--secondary))" }}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              <Bar dataKey="quantity" radius={[0, 6, 6, 0]}>
                {top.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="grid h-[240px] place-items-center text-sm text-muted-foreground">
            {lang === "ar" ? "لا توجد بيانات" : "No data"}
          </p>
        )}
      </div>
    </div>
  );
}
