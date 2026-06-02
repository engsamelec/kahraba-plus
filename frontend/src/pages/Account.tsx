import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import api, { type Order, type Product } from "@/lib/api";
import { AddressBook } from "@/components/AddressBook";
import { useI18n, localizedOrderItem } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { classFor } from "@/lib/format";
import { useMoney } from "@/lib/currency";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Account() {
  const { t, lang } = useI18n();
  const { user, loading: authLoading, refresh } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const money = useMoney();
  const [reordering, setReordering] = useState<number | null>(null);

  // Re-add a past order's items to the cart (fetches current product data so
  // prices/stock are live), then go to the cart.
  async function reorder(order: Order) {
    setReordering(order.id);
    try {
      const ids = order.items.map((i) => i.product_id).filter(Boolean).join(",");
      const { data } = await api.get("/products", {
        params: { ids, per_page: 100 },
      });
      const byId = new Map<number, Product>(
        (data.products as Product[]).map((p) => [p.id, p]),
      );
      let added = 0;
      for (const it of order.items) {
        const prod = byId.get(it.product_id);
        if (!prod || !prod.in_stock) continue;
        // Rebuild the variant cart line so it round-trips through checkout
        // (a product with options requires a variant to be chosen).
        if (it.variant_id) {
          add(
            {
              ...prod,
              id: prod.id * 100000 + it.variant_id,
              base_product_id: prod.id,
              variant_id: it.variant_id,
              price: it.unit_price,
              name: it.variant_label
                ? `${prod.name} — ${it.variant_label}`
                : prod.name,
            },
            it.quantity,
          );
        } else {
          add(prod, it.quantity);
        }
        added++;
      }
      if (added) {
        toast.success(t("reorder_done"));
        navigate("/cart");
      } else {
        toast.error(t("reorder_unavailable"));
      }
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setReordering(null);
    }
  }
  useDocumentTitle(t("my_account"));
  const [tab, setTab] = useState<"orders" | "addresses" | "profile">("orders");
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
      api
        .get("/orders/mine")
        .then((r) => setOrders(r.data))
        .catch((err) => toast.error(getErrorMessage(err) ?? t("error_generic")));
    }
  }, [user, t]);

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
          { id: "addresses", label: t("saved_addresses") },
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
                        {localizedOrderItem(it, lang)} × {it.quantity}
                      </span>
                      <span className="ltr-nums">{money(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3 font-bold">
                  <span>{t("total")}</span>
                  <span className="ltr-nums">{money(o.total_amount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-end gap-3">
                  <button
                    onClick={() => reorder(o)}
                    disabled={reordering === o.id}
                    className="flex items-center gap-1 text-xs font-medium text-accent hover:underline disabled:opacity-50"
                  >
                    {reordering === o.id && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    {t("reorder")}
                  </button>
                  <Link
                    to={`/invoice/${o.order_number}`}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    {t("invoice_view")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "addresses" && <AddressBook />}

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
