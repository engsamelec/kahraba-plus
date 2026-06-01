import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { type ProductVariant } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Manage a product's variants (size / color / material / surcharge / stock).
 * Only shown for already-saved products since variants need a product id.
 */
export function VariantsEditor({ productId }: { productId: number }) {
  const { t } = useI18n();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({
    size: "",
    color: "",
    color_hex: "#000000",
    material: "",
    additional_price: "",
    stock_quantity: "0",
    sku: "",
  });
  const [adding, setAdding] = useState(false);

  function load() {
    setLoading(true);
    api
      .get(`/products/${productId}/variants`)
      .then((r) => setVariants(r.data))
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
      setDraft({
        size: "",
        color: "",
        color_hex: "#000000",
        material: "",
        additional_price: "",
        stock_quantity: "0",
        sku: "",
      });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: number) {
    try {
      await api.delete(`/variants/${id}`);
      setVariants((v) => v.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    }
  }

  const cell = "rounded-lg border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent";

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
              className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                {v.color_hex && (
                  <span
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: v.color_hex }}
                  />
                )}
                <span className="font-medium">{v.label}</span>
                {v.additional_price > 0 && (
                  <span className="text-xs text-muted-foreground ltr-nums">
                    +${v.additional_price}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ltr-nums">
                  · {t("in_stock")}: {v.stock_quantity}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(v.id)}
                className="text-destructive hover:opacity-70"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* add row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
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
    </div>
  );
}
