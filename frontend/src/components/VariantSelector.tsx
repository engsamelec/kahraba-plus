import { useMemo } from "react";
import type { ProductVariant } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface Props {
  variants: ProductVariant[];
  selected: ProductVariant | null;
  onSelect: (v: ProductVariant | null) => void;
}

function uniq(values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v)));
}

/**
 * Lets the customer pick a product variant by size / color / material. Options
 * that would lead to an out-of-stock or nonexistent combination are disabled,
 * so "do you have L in black?" is answered visually.
 */
export function VariantSelector({ variants, selected, onSelect }: Props) {
  const { t } = useI18n();

  const sizes = useMemo(() => uniq(variants.map((v) => v.size)), [variants]);
  const colors = useMemo(() => uniq(variants.map((v) => v.color)), [variants]);
  const materials = useMemo(() => uniq(variants.map((v) => v.material)), [variants]);

  function findVariant(part: Partial<ProductVariant>): ProductVariant | undefined {
    return variants.find(
      (v) =>
        (part.size === undefined || v.size === part.size) &&
        (part.color === undefined || v.color === part.color) &&
        (part.material === undefined || v.material === part.material)
    );
  }

  function choose(part: Partial<ProductVariant>) {
    const merged: Partial<ProductVariant> = {
      size: selected?.size ?? undefined,
      color: selected?.color ?? undefined,
      material: selected?.material ?? undefined,
      ...part,
    };
    onSelect(findVariant(merged) ?? findVariant(part) ?? null);
  }

  function sizeAvailable(size: string) {
    return variants.some((v) => v.size === size && v.in_stock);
  }
  function colorAvailable(color: string) {
    return variants.some((v) => v.color === color && v.in_stock);
  }

  return (
    <div className="space-y-4">
      {sizes.length > 0 && (
        <div>
          <span className="mb-1.5 block text-sm font-medium">{t("size")}</span>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const active = selected?.size === size;
              const avail = sizeAvailable(size);
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!avail}
                  onClick={() => choose({ size })}
                  className={`min-w-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "hover:border-accent/50"
                  } ${!avail ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <span className="mb-1.5 block text-sm font-medium">{t("color")}</span>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color);
              const active = selected?.color === color;
              const avail = colorAvailable(color);
              return (
                <button
                  key={color}
                  type="button"
                  disabled={!avail}
                  onClick={() => choose({ color })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "hover:border-accent/50"
                  } ${!avail ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                >
                  {variant?.color_hex && (
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: variant.color_hex }}
                    />
                  )}
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {materials.length > 0 && (
        <div>
          <span className="mb-1.5 block text-sm font-medium">
            {t("material")}
          </span>
          <div className="flex flex-wrap gap-2">
            {materials.map((material) => {
              const active = selected?.material === material;
              return (
                <button
                  key={material}
                  type="button"
                  onClick={() => choose({ material })}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "hover:border-accent/50"
                  }`}
                >
                  {material}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
