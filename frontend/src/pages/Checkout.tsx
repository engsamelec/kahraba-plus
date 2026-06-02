import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, MapPin, Tag } from "lucide-react";
import { toast } from "sonner";
import api, { type Address, type Quote } from "@/lib/api";
import { useI18n, localized } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useMoney } from "@/lib/currency";
import { getErrorMessage } from "@/lib/utils";
import { TrustBadges } from "@/components/TrustBadges";
import { FreeShippingBar } from "@/components/FreeShippingBar";
import { Button } from "@/components/ui/button";

// Value stays in English (stored on the order); the label is localized.
const COUNTRIES: { value: string; ar: string; he: string }[] = [
  { value: "Syria", ar: "سوريا", he: "סוריה" },
  { value: "Palestine", ar: "فلسطين", he: "פלסטין" },
  { value: "Lebanon", ar: "لبنان", he: "לבנון" },
  { value: "Jordan", ar: "الأردن", he: "ירדן" },
  { value: "Iraq", ar: "العراق", he: "עיראק" },
  { value: "Saudi Arabia", ar: "السعودية", he: "ערב הסעודית" },
  { value: "UAE", ar: "الإمارات", he: 'איחוד האמירויות' },
  { value: "Egypt", ar: "مصر", he: "מצרים" },
  { value: "Turkey", ar: "تركيا", he: "טורקיה" },
  { value: "Germany", ar: "ألمانيا", he: "גרמניה" },
  { value: "United States", ar: "الولايات المتحدة", he: 'ארה"ב' },
  { value: "United Kingdom", ar: "المملكة المتحدة", he: "בריטניה" },
];

function countryLabel(c: { value: string; ar: string; he: string }, lang: string) {
  if (lang === "ar") return c.ar;
  if (lang === "he") return c.he;
  return c.value;
}

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
  const [quoteError, setQuoteError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);

  function applyAddress(a: Address) {
    setForm((f) => ({
      ...f,
      customer_name: a.full_name || f.customer_name,
      customer_phone: a.phone || f.customer_phone,
      shipping_address: [a.address_line1, a.address_line2].filter(Boolean).join(", "),
      shipping_city: a.city || f.shipping_city,
      shipping_country: a.country || f.shipping_country,
    }));
  }

  // Logged-in customers: load saved addresses and prefill the default one so
  // repeat checkout is one tap.
  useEffect(() => {
    if (!user) return;
    api
      .get("/auth/me/addresses")
      .then((r) => {
        setAddresses(r.data);
        const def = r.data.find((a: Address) => a.is_default) ?? r.data[0];
        if (def) applyAddress(def);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (items.length === 0) return;
    const payload = {
      items: items.map((l) => ({
        product_id: l.product.base_product_id ?? l.product.id,
        variant_id: l.product.variant_id,
        quantity: l.quantity,
      })),
      country: form.shipping_country,
      coupon_code: appliedCoupon || undefined,
    };
    api
      .post("/orders/quote", payload)
      .then((r) => {
        setQuote(r.data);
        setQuoteError("");
      })
      .catch((err) => {
        setQuote(null);
        // Surface a stale-cart problem (out of stock / unavailable) up front
        // instead of letting the user fill the form and fail at submit.
        setQuoteError(getErrorMessage(err) ?? t("error_generic"));
      });
  }, [items, form.shipping_country, appliedCoupon, t]);

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
          product_id: l.product.base_product_id ?? l.product.id,
          variant_id: l.product.variant_id,
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
          {/* Saved addresses — one tap to fill the form */}
          {addresses.length > 0 && (
            <section className="rounded-xl border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-accent" /> {t("saved_addresses")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => applyAddress(a)}
                    className="rounded-lg border px-3 py-2 text-start text-xs transition-colors hover:border-accent hover:bg-accent/5"
                  >
                    <span className="block font-medium">{a.full_name}</span>
                    <span className="block text-muted-foreground">
                      {a.city}, {a.country}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

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
                    <option key={c.value} value={c.value}>
                      {countryLabel(c, lang)}
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
        <div className="lg:col-span-1 space-y-4">
          <FreeShippingBar subtotalUsd={quote?.subtotal ?? subtotal} />
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
            {quoteError && (
              <p className="mt-3 rounded-lg bg-destructive/10 p-2 text-center text-xs text-destructive">
                {quoteError}
              </p>
            )}
            <Button
              type="submit"
              disabled={submitting || !quote}
              className="mt-4 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
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
