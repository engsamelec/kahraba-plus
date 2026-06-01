import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import api, { type Quote } from "@/lib/api";
import { useI18n, localized } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useMoney } from "@/lib/currency";
import { getErrorMessage } from "@/lib/utils";
import { TrustBadges } from "@/components/TrustBadges";
import { Button } from "@/components/ui/button";

const COUNTRIES = [
  "Syria",
  "Lebanon",
  "Jordan",
  "Iraq",
  "Saudi Arabia",
  "UAE",
  "Egypt",
  "Turkey",
  "Germany",
  "United States",
  "United Kingdom",
];

export default function Checkout() {
  const { t, lang } = useI18n();
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const money = useMoney();
  const navigate = useNavigate();
  useDocumentTitle(t("checkout_title"));

  const [form, setForm] = useState({
    customer_name: user ? `${user.first_name} ${user.last_name}`.trim() : "",
    customer_email: user?.email || "",
    customer_phone: user?.phone || "",
    shipping_address: "",
    shipping_city: "",
    shipping_country: "Syria",
    notes: "",
    payment_method: "cod",
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");

  useEffect(() => {
    if (items.length === 0) return;
    const payload = {
      items: items.map((l) => ({
        product_id: l.product.id,
        quantity: l.quantity,
      })),
      country: form.shipping_country,
      coupon_code: appliedCoupon || undefined,
    };
    api
      .post("/orders/quote", payload)
      .then((r) => setQuote(r.data))
      .catch(() => setQuote(null));
  }, [items, form.shipping_country, appliedCoupon]);

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        coupon_code: appliedCoupon || undefined,
        items: items.map((l) => ({
          product_id: l.product.id,
          quantity: l.quantity,
        })),
      };
      const { data } = await api.post("/orders", payload);
      clear();
      navigate(`/order-confirmation/${data.order_number}`);
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="container py-8">
      <h1 className="mb-1 text-2xl font-bold">{t("checkout_title")}</h1>
      {!user && (
        <p className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          {t("guest_checkout_note")}
        </p>
      )}
      <form onSubmit={submit} className="mt-5 grid gap-8 lg:grid-cols-3">
        {/* form */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">{t("contact_info")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  {t("full_name")}
                </label>
                <input
                  required
                  className={inputCls}
                  value={form.customer_name}
                  onChange={(e) => set("customer_name", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("email")}</label>
                <input
                  type="email"
                  required
                  className={inputCls}
                  value={form.customer_email}
                  onChange={(e) => set("customer_email", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("phone")}</label>
                <input
                  className={inputCls}
                  value={form.customer_phone}
                  onChange={(e) => set("customer_phone", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">{t("shipping_info")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">{t("address")}</label>
                <input
                  required
                  className={inputCls}
                  value={form.shipping_address}
                  onChange={(e) => set("shipping_address", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("city")}</label>
                <input
                  required
                  className={inputCls}
                  value={form.shipping_city}
                  onChange={(e) => set("shipping_city", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("country")}</label>
                <select
                  className={inputCls}
                  value={form.shipping_country}
                  onChange={(e) => set("shipping_country", e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">{t("notes")}</label>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">{t("payment_method")}</h3>
            <div className="space-y-2">
              {[
                { id: "cod", label: t("pay_cod") },
                { id: "card", label: t("pay_card") },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                    form.payment_method === m.id
                      ? "border-accent bg-accent/5"
                      : "hover:bg-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={form.payment_method === m.id}
                    onChange={() => set("payment_method", m.id)}
                    className="accent-[hsl(var(--accent))]"
                  />
                  <span className="font-medium">{m.label}</span>
                  {m.id === "card" && (
                    <span className="ltr:ml-auto rtl:mr-auto text-xs text-muted-foreground">
                      {t("soon")}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 rounded-xl border bg-card p-6">
            <h3 className="mb-4 font-bold">{t("order_summary")}</h3>
            <div className="mb-4 max-h-48 space-y-3 overflow-y-auto">
              {items.map((l) => (
                <div key={l.product.id} className="flex items-center gap-3 text-sm">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {l.product.image_urls[0] && (
                      <img
                        src={l.product.image_urls[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute -top-1 ltr:-right-1 rtl:-left-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                      {l.quantity}
                    </span>
                  </div>
                  <span className="line-clamp-2 flex-1">
                    {localized(l.product, lang)}
                  </span>
                  <span className="font-semibold ltr-nums">
                    {money(l.product.price * l.quantity)}
                  </span>
                </div>
              ))}
            </div>
            {/* coupon */}
            <div className="border-t pt-4">
              {appliedCoupon && quote?.coupon_code ? (
                <div className="flex items-center justify-between rounded-lg bg-green-500/10 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
                    <Tag className="h-4 w-4" /> {quote.coupon_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon("");
                      setCouponInput("");
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    {t("remove")}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder={t("coupon_placeholder")}
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-accent"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!couponInput.trim()}
                      onClick={() => setAppliedCoupon(couponInput.trim())}
                    >
                      {t("coupon_apply")}
                    </Button>
                  </div>
                  {appliedCoupon && quote?.coupon_error && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {t(`coupon_err_${quote.coupon_error}`)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="ltr-nums">
                  {money(quote?.subtotal ?? subtotal)}
                </span>
              </div>
              {quote && quote.discount && quote.discount > 0 ? (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>{t("discount")}</span>
                  <span className="ltr-nums">−{money(quote.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span className="ltr-nums">
                  {quote
                    ? quote.shipping_cost === 0
                      ? t("free")
                      : money(quote.shipping_cost)
                    : "—"}
                </span>
              </div>
              {quote && quote.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("tax")}</span>
                  <span className="ltr-nums">{money(quote.tax)}</span>
                </div>
              )}
            </div>
            <div className="my-4 border-t" />
            <div className="flex justify-between text-lg font-bold">
              <span>{t("total")}</span>
              <span className="ltr-nums">
                {money(quote?.total_amount ?? subtotal)}
              </span>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("place_order")}
            </Button>
            <div className="mt-4">
              <TrustBadges />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
