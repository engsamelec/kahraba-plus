import { lazy, Suspense, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Download,
  Loader2,
  Package,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import api, { type Category, type Order, type Product } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatPrice, classFor } from "@/lib/format";
import { getErrorMessage } from "@/lib/utils";
import type { SalesPoint, TopProduct } from "@/components/AdminCharts";
import { ImageUploader } from "@/components/ImageUploader";
import { VariantsEditor } from "@/components/VariantsEditor";
import { ImportAdmin } from "@/components/ImportAdmin";
import { CatalogHealth } from "@/components/CatalogHealth";
import { CouponsAdmin } from "@/components/CouponsAdmin";
import { Accounting } from "@/components/Accounting";
import { PromotionsAdmin } from "@/components/PromotionsAdmin";
import { CategoriesAdmin } from "@/components/CategoriesAdmin";
import { UsersAdmin } from "@/components/UsersAdmin";
import { SubscribersAdmin } from "@/components/SubscribersAdmin";
import { SettingsAdmin } from "@/components/SettingsAdmin";
import { Button } from "@/components/ui/button";

interface Stats {
  total_orders: number;
  revenue: number;
  pending_orders: number;
  total_products: number;
  total_customers: number;
  sales_series?: SalesPoint[];
  top_products?: TopProduct[];
}

// Lazy so recharts only loads when an admin opens the dashboard.
const AdminCharts = lazy(() => import("@/components/AdminCharts"));

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function Admin() {
  const { t } = useI18n();
  // Auth/admin gating and the page chrome are handled by AdminLayout.
  const [tab, setTab] = useState<
    | "dashboard"
    | "products"
    | "orders"
    | "accounting"
    | "import"
    | "health"
    | "coupons"
    | "promos"
    | "categories"
    | "users"
    | "subscribers"
    | "settings"
  >("dashboard");
  useDocumentTitle(t("admin_dashboard"));

  return (
    <div>
      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b">
        {[
          { id: "dashboard", label: t("admin_dashboard") },
          { id: "products", label: t("admin_products") },
          { id: "categories", label: t("admin_categories") },
          { id: "orders", label: t("admin_orders") },
          { id: "accounting", label: t("acc_tab") },
          { id: "import", label: t("import_csv") },
          { id: "health", label: t("health_tab") },
          { id: "coupons", label: t("coupons") },
          { id: "promos", label: t("promos_title") },
          { id: "users", label: t("admin_users") },
          { id: "subscribers", label: t("admin_subscribers") },
          { id: "settings", label: t("admin_settings") },
        ].map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id as typeof tab)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${
              tab === tb.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <Dashboard />}
      {tab === "products" && <ProductsAdmin />}
      {tab === "orders" && <OrdersAdmin />}
      {tab === "accounting" && <Accounting />}
      {tab === "import" && <ImportAdmin />}
      {tab === "health" && <CatalogHealth />}
      {tab === "coupons" && <CouponsAdmin />}
      {tab === "promos" && <PromotionsAdmin />}
      {tab === "categories" && <CategoriesAdmin />}
      {tab === "users" && <UsersAdmin />}
      {tab === "subscribers" && <SubscribersAdmin />}
      {tab === "settings" && <SettingsAdmin />}
    </div>
  );
}

function Dashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data));
  }, []);

  const cards = [
    {
      label: t("total_revenue"),
      value: stats ? formatPrice(stats.revenue) : "—",
      icon: DollarSign,
    },
    { label: t("total_orders"), value: stats?.total_orders ?? "—", icon: ShoppingBag },
    {
      label: t("pending_orders"),
      value: stats?.pending_orders ?? "—",
      icon: Package,
    },
    {
      label: t("total_products"),
      value: stats?.total_products ?? "—",
      icon: Package,
    },
    { label: t("total_customers"), value: stats?.total_customers ?? "—", icon: Users },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent/15 text-accent">
                <c.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold ltr-nums">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {stats && (
        <Suspense
          fallback={
            <div className="mt-6 grid place-items-center rounded-xl border bg-card py-16">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          }
        >
          <AdminCharts
            sales={stats.sales_series ?? []}
            top={stats.top_products ?? []}
          />
        </Suspense>
      )}
    </div>
  );
}

interface ProductForm {
  id?: number;
  name: string;
  name_ar: string;
  name_he: string;
  brand: string;
  sku: string;
  barcode: string;
  tags: string;
  video_url: string;
  price: number | string;
  cost: number | string;
  compare_at_price: number | string;
  stock_quantity: number | string;
  category_id: number | string;
  description: string;
  description_ar: string;
  image_urls: string[];
  image_hashes: (number | string)[];
  is_featured: boolean;
  is_active: boolean;
}

const EMPTY_PRODUCT: ProductForm = {
  name: "",
  name_ar: "",
  name_he: "",
  brand: "",
  sku: "",
  barcode: "",
  tags: "",
  video_url: "",
  price: 0,
  cost: "",
  compare_at_price: "",
  stock_quantity: 0,
  category_id: "",
  description: "",
  description_ar: "",
  image_urls: [],
  image_hashes: [],
  is_featured: false,
  is_active: true,
};

function ProductsAdmin() {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<ProductForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pct, setPct] = useState("");
  const [search, setSearch] = useState("");

  function toggleSel(id: number) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function bulk(action: string, value?: number) {
    if (selected.size === 0) return;
    try {
      const { data } = await api.post("/products/bulk", {
        product_ids: [...selected],
        action,
        value,
      });
      toast.success(`${t("bulk_done")} (${data.updated})`);
      setSelected(new Set());
      setPct("");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    }
  }

  function load() {
    // include_inactive so the admin sees archived/hidden products too.
    const params: Record<string, string | number> = {
      per_page: 100,
      include_inactive: "true",
    };
    if (search.trim()) params.search = search.trim();
    api.get("/products", { params }).then((r) => setProducts(r.data.products));
  }

  // Debounced reload as the admin types in the product search.
  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data));
  }, []);

  function openNew() {
    setEditing({ ...EMPTY_PRODUCT });
  }

  function openEdit(p: Product) {
    setEditing({
      id: p.id,
      name: p.name,
      name_ar: p.name_ar || "",
      name_he: p.name_he || "",
      brand: p.brand || "",
      sku: p.sku || "",
      barcode: p.barcode || "",
      tags: (p.tags || []).join(", "),
      video_url: p.video_url || "",
      price: p.price,
      cost: p.cost ?? "",
      compare_at_price: p.compare_at_price || "",
      stock_quantity: p.stock_quantity,
      category_id: p.category_id || "",
      description: p.description || "",
      description_ar: p.description_ar || "",
      image_urls: p.image_urls || [],
      image_hashes: p.image_hashes || [],
      is_featured: p.is_featured,
      is_active: p.is_active ?? true,
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const payload = {
      name: editing.name,
      name_ar: editing.name_ar,
      name_he: editing.name_he,
      brand: editing.brand,
      sku: editing.sku || null,
      barcode: editing.barcode || null,
      tags: editing.tags,
      video_url: editing.video_url || null,
      price: Number(editing.price),
      cost: editing.cost === "" ? null : Number(editing.cost),
      compare_at_price: editing.compare_at_price
        ? Number(editing.compare_at_price)
        : null,
      stock_quantity: Number(editing.stock_quantity),
      category_id: editing.category_id ? Number(editing.category_id) : null,
      description: editing.description,
      description_ar: editing.description_ar,
      image_urls: editing.image_urls,
      image_hashes: editing.image_hashes,
      is_featured: editing.is_featured,
      is_active: editing.is_active,
    };
    try {
      if (editing.id) {
        await api.put(`/products/${editing.id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      toast.success(t("save_product"));
      setEditing(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setSaving(false);
    }
  }

  async function del(id: number) {
    if (!confirm(t("delete") + "?")) return;
    await api.delete(`/products/${id}`);
    toast.success(t("delete"));
    load();
  }

  const inputCls =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search_placeholder")}
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <Button
          onClick={openNew}
          className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" /> {t("add_product")}
        </Button>
      </div>

      {/* Bulk actions on the selected rows */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border bg-accent/5 p-3 text-sm">
          <span className="font-semibold ltr-nums">
            {selected.size} {t("bulk_selected")}
          </span>
          <span className="mx-1 h-4 w-px bg-border" />
          <input
            type="number"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder="%"
            className="w-20 rounded-lg border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={() => pct && bulk("price_percent", Number(pct))}
            className="rounded-lg border px-3 py-1.5 font-medium hover:bg-secondary"
          >
            {t("bulk_apply_pct")}
          </button>
          <span className="mx-1 h-4 w-px bg-border" />
          <button
            onClick={() => bulk("activate")}
            className="rounded-lg border px-3 py-1.5 font-medium hover:bg-secondary"
          >
            {t("bulk_show")}
          </button>
          <button
            onClick={() => bulk("deactivate")}
            className="rounded-lg border px-3 py-1.5 font-medium hover:bg-secondary"
          >
            {t("bulk_hide")}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ltr:ml-auto rtl:mr-auto text-xs text-muted-foreground hover:underline"
          >
            {t("cancel")}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/40 text-start">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  aria-label="select all"
                  checked={products.length > 0 && selected.size === products.length}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? new Set(products.map((p) => p.id)) : new Set(),
                    )
                  }
                  className="h-4 w-4 accent-[hsl(var(--accent))]"
                />
              </th>
              <th className="p-3 text-start font-medium">{t("admin_products")}</th>
              <th className="p-3 text-start font-medium">{t("brand_label")}</th>
              <th className="p-3 text-start font-medium ltr-nums">$</th>
              <th className="p-3 text-start font-medium">{t("in_stock")}</th>
              <th className="p-3 text-end font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">
                  <input
                    type="checkbox"
                    aria-label={`select ${p.name}`}
                    checked={selected.has(p.id)}
                    onChange={() => toggleSel(p.id)}
                    className="h-4 w-4 accent-[hsl(var(--accent))]"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded bg-secondary">
                      {p.image_urls[0] && (
                        <img
                          src={p.image_urls[0]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="line-clamp-1 font-medium">
                        {p.name}
                        {p.is_active === false && (
                          <span className="ms-2 rounded-full bg-muted px-1.5 py-0.5 align-middle text-[10px] font-semibold text-muted-foreground">
                            {t("hidden_label")}
                          </span>
                        )}
                      </span>
                      {p.product_number && (
                        <span className="block text-xs text-muted-foreground ltr-nums">
                          {p.product_number}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{p.brand}</td>
                <td className="p-3 ltr-nums">{formatPrice(p.price)}</td>
                <td className="p-3 ltr-nums">{p.stock_quantity}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => del(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setEditing(null)}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">
              {editing.id ? t("edit") : t("add_product")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Name (EN)"
                className={inputCls}
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
              <input
                placeholder="الاسم (ع)"
                className={inputCls}
                value={editing.name_ar}
                onChange={(e) =>
                  setEditing({ ...editing, name_ar: e.target.value })
                }
              />
              <input
                placeholder="שם (עברית)"
                dir="rtl"
                className={`${inputCls} sm:col-span-2`}
                value={editing.name_he}
                onChange={(e) =>
                  setEditing({ ...editing, name_he: e.target.value })
                }
              />
              <input
                placeholder={t("brand_label")}
                className={inputCls}
                value={editing.brand}
                onChange={(e) =>
                  setEditing({ ...editing, brand: e.target.value })
                }
              />
              <input
                placeholder={t("sku_label")}
                className={inputCls}
                value={editing.sku}
                onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
              />
              <input
                placeholder={t("barcode")}
                className={inputCls}
                value={editing.barcode}
                onChange={(e) => setEditing({ ...editing, barcode: e.target.value })}
              />
              <input
                placeholder={`${t("tags")} (a, b, c)`}
                className={`${inputCls} sm:col-span-2`}
                value={editing.tags}
                onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
              />
              <input
                placeholder={t("video_url")}
                dir="ltr"
                className={`${inputCls} sm:col-span-2`}
                value={editing.video_url}
                onChange={(e) =>
                  setEditing({ ...editing, video_url: e.target.value })
                }
              />
              <input
                type="number"
                step="0.01"
                placeholder={`${t("price")} ($)`}
                className={inputCls}
                value={editing.price}
                onChange={(e) =>
                  setEditing({ ...editing, price: e.target.value })
                }
              />
              <input
                type="number"
                step="0.01"
                placeholder={`${t("cost")} ($)`}
                title={t("cost_hint")}
                className={inputCls}
                value={editing.cost}
                onChange={(e) =>
                  setEditing({ ...editing, cost: e.target.value })
                }
              />
              <input
                type="number"
                step="0.01"
                placeholder="Compare at price"
                className={inputCls}
                value={editing.compare_at_price}
                onChange={(e) =>
                  setEditing({ ...editing, compare_at_price: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Stock"
                className={inputCls}
                value={editing.stock_quantity}
                onChange={(e) =>
                  setEditing({ ...editing, stock_quantity: e.target.value })
                }
              />
              <select
                className={inputCls}
                value={editing.category_id}
                onChange={(e) =>
                  setEditing({ ...editing, category_id: e.target.value })
                }
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ImageUploader
                urls={editing.image_urls}
                hashes={editing.image_hashes}
                onChange={(image_urls, image_hashes) =>
                  setEditing({ ...editing, image_urls, image_hashes })
                }
              />
              <textarea
                placeholder="Description (EN)"
                rows={2}
                className={`${inputCls} sm:col-span-2`}
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
              <textarea
                placeholder="الوصف (ع)"
                rows={2}
                className={`${inputCls} sm:col-span-2`}
                value={editing.description_ar}
                onChange={(e) =>
                  setEditing({ ...editing, description_ar: e.target.value })
                }
              />
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={editing.is_featured}
                  onChange={(e) =>
                    setEditing({ ...editing, is_featured: e.target.checked })
                  }
                  className="h-4 w-4 accent-[hsl(var(--accent))]"
                />
                {t("featured")}
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) =>
                    setEditing({ ...editing, is_active: e.target.checked })
                  }
                  className="h-4 w-4 accent-[hsl(var(--accent))]"
                />
                {t("active_visible")}
              </label>

              {editing.id ? (
                <VariantsEditor productId={editing.id} />
              ) : (
                <p className="sm:col-span-2 rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  {t("save_first_for_variants")}
                </p>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                {t("remove")}
              </Button>
              <Button
                onClick={save}
                disabled={saving}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("save_product")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersAdmin() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  function load() {
    api.get("/admin/orders").then((r) => setOrders(r.data));
  }
  useEffect(load, []);

  async function updateStatus(id: number, field: string, value: string) {
    await api.put(`/admin/orders/${id}`, { [field]: value });
    toast.success(t("save"));
    load();
  }

  async function exportCsv() {
    // Fetch through the api client so the admin auth header is attached, then
    // download the returned CSV as a file.
    const { data } = await api.get("/admin/orders/export", {
      responseType: "blob",
    });
    const url = URL.createObjectURL(data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kahraba-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {orders.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-secondary"
          >
            <Download className="h-4 w-4" /> {t("export_csv")}
          </button>
        </div>
      )}
      {orders.length === 0 && (
        <div className="grid place-items-center rounded-xl border border-dashed py-20 text-muted-foreground">
          {t("no_orders")}
        </div>
      )}
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-mono font-bold text-accent">
                {o.order_number}
              </span>
              <p className="text-xs text-muted-foreground">
                {o.customer_name} · {o.shipping_city}, {o.shipping_country} ·{" "}
                {o.created_at?.slice(0, 10)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${classFor(
                  o.status
                )}`}
              >
                {t(`status_${o.status}`)}
              </span>
              <select
                value={o.status}
                onChange={(e) => updateStatus(o.id, "status", e.target.value)}
                className="rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-accent"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status_${s}`)}
                  </option>
                ))}
              </select>
              <select
                value={o.payment_status}
                onChange={(e) =>
                  updateStatus(o.id, "payment_status", e.target.value)
                }
                className="rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-accent"
              >
                {["unpaid", "paid", "refunded"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
            <button
              onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              className="flex items-center gap-1 font-medium text-accent hover:underline"
            >
              {expanded === o.id ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {o.items.reduce((n, it) => n + it.quantity, 0)} {t("nav_cart")} ·{" "}
              {o.payment_method.toUpperCase()}
            </button>
            <span className="font-bold ltr-nums">
              {formatPrice(o.total_amount)}
            </span>
          </div>

          {/* Full order detail so the admin can pick / pack / ship */}
          {expanded === o.id && (
            <div className="mt-3 grid gap-4 border-t pt-3 text-sm md:grid-cols-2">
              <div>
                <h4 className="mb-1 font-semibold">{t("contact_info")}</h4>
                <p className="text-muted-foreground">{o.customer_name}</p>
                <p className="text-muted-foreground">{o.customer_email}</p>
                {o.customer_phone && (
                  <p className="text-muted-foreground ltr-nums">
                    {o.customer_phone}
                  </p>
                )}
                <h4 className="mb-1 mt-3 font-semibold">{t("shipping")}</h4>
                <p className="text-muted-foreground">
                  {o.shipping_address}, {o.shipping_city}, {o.shipping_country}
                </p>
                {o.notes && (
                  <p className="mt-2 rounded-lg bg-secondary/60 p-2 text-xs text-muted-foreground">
                    {o.notes}
                  </p>
                )}
              </div>
              <div>
                <h4 className="mb-1 font-semibold">{t("order_summary")}</h4>
                <ul className="space-y-1">
                  {o.items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-2">
                      <span>
                        {it.product_name}
                        {it.variant_label ? ` — ${it.variant_label}` : ""}
                        <span className="text-muted-foreground ltr-nums">
                          {" "}
                          ×{it.quantity}
                        </span>
                      </span>
                      <span className="ltr-nums">{formatPrice(it.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 space-y-0.5 border-t pt-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t("subtotal")}</span>
                    <span className="ltr-nums">{formatPrice(o.subtotal)}</span>
                  </div>
                  {(o.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>
                        {t("discount")}
                        {o.coupon_code ? ` (${o.coupon_code})` : ""}
                      </span>
                      <span className="ltr-nums">
                        −{formatPrice(o.discount ?? 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t("shipping")}</span>
                    <span className="ltr-nums">
                      {formatPrice(o.shipping_cost ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
