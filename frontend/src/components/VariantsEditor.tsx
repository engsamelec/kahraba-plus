import { useEffect, useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { type ProductVariant } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const EMPTY = {
  size: "",
  color: "",
  color_hex: "#000000",
  material: "",
  additional_price: "",
  stock_quantity: "0",
  sku: "",
};

/**
 * Manage a product's variants (size / color / material / surcharge / stock).
 * Each existing variant's stock, surcharge and availability are editable inline;
 * only shown for already-saved products since variants need a product id.
 */
export function VariantsEditor({ productId }: { productId: number }) {
  const { t } = useI18n();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ ...EMPTY });
  const [adding, setAdding] = useState(false);
  // per-variant inline edits
  const [edits, setEdits] = useState<
    Record<number, { stock_quantity: string; additional_price: string }>
  >({});

  function load() {
    setLoading(true);
    api
      .get(`/products/${productId}/variants`)
      .then((r) => {
        setVariants(r.data);
        setEdits(
          Object.fromEntries(
            r.data.map((v: ProductVariant) => [
              v.id,
              {
                stock_quantity: String(v.stock_quantity),
                additional_price: String(v.additional_price),
              },
            ]),
          ),
        );
      })
      .catch((err) => toast.error(getErrorMessage(err) ?? t("error_generic")))
      .finally(() => setLoading(false));
  }
  useEffect(load, [productId]);

  async function add() {
    if (!draft.size && !draft.color && !draft.material) {
      toast.error(t("variant_need_attr"));
      return;
    }
    setAdding(true);
    try {
      await api.post(`/products/${productId}/variants`, {
        ...draft,
        additional_price: Number(draft.additional_price || 0),
        stock_quantity: Number(draft.stock_quantity || 0),
      });
      setDraft({ ...EMPTY });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setAdding(false);
    }
  }

  async function saveVariant(v: ProductVariant) {
    const e = edits[v.id];
    if (!e) return;
    try {
      await api.put(`/variants/${v.id}`, {
        stock_quantity: Number(e.stock_quantity || 0),
        additional_price: Number(e.additional_price || 0),
      });
      toast.success(t("save"));
      load();
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    }
  }

  async function toggleAvail(v: ProductVariant) {
    try {
      await api.put(`/variants/${v.id}`, { is_available: !v.is_available });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    }
  }

  async function remove(id: number) {
    try {
      await api.delete(`/variants/${id}`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    }
  }

  const cell =
    "rounded-lg border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="sm:col-span-2 rounded-lg border bg-secondary/30 p-4">
      <h4 className="mb-3 text-sm font-semibold">{t("variants")}</h4>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      ) : variants.length === 0 ? (
        <p className="mb-3 text-xs text-muted-foreground">{t("no_variants")}</p>
      ) : (
        <div className="mb-3 space-y-2">
          {variants.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
            >
              <span className="flex min-w-28 items-center gap-2">
                {v.color_hex && (
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border"
                    style={{ backgroundColor: v.color_hex }}
                  />
                )}
                <span className="font-medium">{v.label}</span>
              </span>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                +$
                <input
                  inputMode="decimal"
                  aria-label={t("price")}
                  className={`${cell} w-16`}
                  value={edits[v.id]?.additional_price ?? ""}
                  onChange={(e) =>
                    setEdits((s) => ({
                      ...s,
                      [v.id]: { ...s[v.id], additional_price: e.target.value },
                    }))
                  }
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                {t("in_stock")}
                <input
                  inputMode="numeric"
                  aria-label={t("in_stock")}
                  className={`${cell} w-16`}
                  value={edits[v.id]?.stock_quantity ?? ""}
                  onChange={(e) =>
                    setEdits((s) => ({
                      ...s,
                      [v.id]: { ...s[v.id], stock_quantity: e.target.value },
                    }))
                  }
                />
              </label>
              <button
                type="button"
                onClick={() => toggleAvail(v)}
                className={`rounded-full px-2 py-0.5 text-xs ${
                  v.is_available
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {v.is_available ? t("active") : t("inactive")}
              </button>
              <span className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => saveVariant(v)}
                  aria-label={t("save")}
                  className="text-accent hover:opacity-70"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(v.id)}
                  aria-label={t("delete")}
                  className="text-destructive hover:opacity-70"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* add row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
        <input
          placeholder={t("size")}
          className={cell}
          value={draft.size}
          onChange={(e) => setDraft({ ...draft, size: e.target.value })}
        />
        <input
          placeholder={t("color")}
          className={cell}
          value={draft.color}
          onChange={(e) => setDraft({ ...draft, color: e.target.value })}
        />
        <input
          type="color"
          aria-label={t("color")}
          className="h-9 w-full rounded-lg border bg-background"
          value={draft.color_hex}
          onChange={(e) => setDraft({ ...draft, color_hex: e.target.value })}
        />
        <input
          placeholder={t("material")}
          className={cell}
          value={draft.material}
          onChange={(e) => setDraft({ ...draft, material: e.target.value })}
        />
        <input
          placeholder={`+${t("price")}`}
          inputMode="decimal"
          className={cell}
          value={draft.additional_price}
          onChange={(e) =>
            setDraft({ ...draft, additional_price: e.target.value })
          }
        />
        <input
          placeholder={t("in_stock")}
          inputMode="numeric"
          className={cell}
          value={draft.stock_quantity}
          onChange={(e) =>
            setDraft({ ...draft, stock_quantity: e.target.value })
          }
        />
        <Button
          type="button"
          size="sm"
          disabled={adding}
          onClick={add}
          className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
      <input
        placeholder={`SKU (${t("optional")})`}
        className={`${cell} mt-2 w-full`}
        value={draft.sku}
        onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
      />
    </div>
  );
}
