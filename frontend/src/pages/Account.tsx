import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import api, { type Order } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatPrice, classFor } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function Account() {
  const { t } = useI18n();
  const { user, loading: authLoading, refresh } = useAuth();
  useDocumentTitle(t("my_account"));
  const [tab, setTab] = useState<"orders" | "profile">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || "",
      });
      api.get("/orders/mine").then((r) => setOrders(r.data));
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="container grid place-items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  async function saveProfile() {
    setSaving(true);
    try {
      await api.put("/auth/me", profile);
      await refresh();
      toast.success(t("save"));
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("my_account")}</h1>

      <div className="mb-6 flex gap-1 border-b">
        {[
          { id: "orders", label: t("my_orders") },
          { id: "profile", label: t("profile") },
        ].map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id as typeof tab)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium ${
              tab === tb.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "orders" &&
        (orders.length === 0 ? (
          <div className="grid place-items-center rounded-xl border border-dashed py-20 text-center">
            <Package className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">{t("no_orders")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border bg-card p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-accent">
                      {o.order_number}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {o.created_at?.slice(0, 10)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${classFor(
                      o.status
                    )}`}
                  >
                    {t(`status_${o.status}`)}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  {o.items.map((it) => (
                    <div key={it.id} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {it.product_name} × {it.quantity}
                      </span>
                      <span className="ltr-nums">{formatPrice(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between border-t pt-3 font-bold">
                  <span>{t("total")}</span>
                  <span className="ltr-nums">{formatPrice(o.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "profile" && (
        <div className="max-w-md space-y-4 rounded-xl border bg-card p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("full_name")}
              </label>
              <input
                className={inputCls}
                value={profile.first_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, first_name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">&nbsp;</label>
              <input
                className={inputCls}
                value={profile.last_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, last_name: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("email")}</label>
            <input className={inputCls} value={user.email} disabled />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("phone")}</label>
            <input
              className={inputCls}
              value={profile.phone}
              onChange={(e) =>
                setProfile((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </div>
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </div>
      )}
    </div>
  );
}
