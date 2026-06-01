import { useEffect, useState } from "react";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { type Coupon } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CouponsAdmin() {
  const { t } = useI18n();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({
    code: "",
    discount_type: "percent",
    value: "",
    min_subtotal: "",
    max_uses: "",
    expires_at: "",
  });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/admin/coupons")
      .then((r) => setCoupons(r.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function create() {
    if (!draft.code.trim() || !draft.value) {
      toast.error(t("coupon_need_fields"));
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/coupons", {
        ...draft,
        value: Number(draft.value),
        min_subtotal: Number(draft.min_subtotal || 0),
        max_uses: draft.max_uses ? Number(draft.max_uses) : null,
        expires_at: draft.expires_at || null,
      });
      setDraft({
        code: "",
        discount_type: "percent",
        value: "",
        min_subtotal: "",
        max_uses: "",
        expires_at: "",
      });
      load();
      toast.success(t("save"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(c: Coupon) {
    await api.put(`/admin/coupons/${c.id}`, { is_active: !c.is_active });
    load();
  }

  async function remove(id: number) {
    await api.delete(`/admin/coupons/${id}`);
    setCoupons((cs) => cs.filter((c) => c.id !== id));
  }

  const cell =
    "rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-bold">{t("coupons")}</h2>
        <p className="text-sm text-muted-foreground">{t("coupons_hint")}</p>
      </div>

      {/* create */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border bg-secondary/30 p-4 sm:grid-cols-3">
        <input
          placeholder={t("coupon_placeholder")}
          className={`${cell} uppercase`}
          value={draft.code}
          onChange={(e) => setDraft({ ...draft, code: e.target.value })}
        />
        <select
          className={cell}
          value={draft.discount_type}
          onChange={(e) => setDraft({ ...draft, discount_type: e.target.value })}
        >
          <option value="percent">% {t("discount")}</option>
          <option value="fixed">$ {t("discount")}</option>
        </select>
        <input
          placeholder={draft.discount_type === "percent" ? "%" : "$"}
          inputMode="decimal"
          className={cell}
          value={draft.value}
          onChange={(e) => setDraft({ ...draft, value: e.target.value })}
        />
        <input
          placeholder={`${t("coupon_min")} ($)`}
          inputMode="decimal"
          className={cell}
          value={draft.min_subtotal}
          onChange={(e) => setDraft({ ...draft, min_subtotal: e.target.value })}
        />
        <input
          placeholder={t("coupon_max_uses")}
          inputMode="numeric"
          className={cell}
          value={draft.max_uses}
          onChange={(e) => setDraft({ ...draft, max_uses: e.target.value })}
        />
        <input
          type="date"
          aria-label={t("coupon_expires")}
          className={cell}
          value={draft.expires_at}
          onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })}
        />
        <Button
          onClick={create}
          disabled={saving}
          className="col-span-2 gap-1 bg-accent text-accent-foreground hover:bg-accent/90 sm:col-span-3"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {t("add")}
        </Button>
      </div>

      {/* list */}
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      ) : coupons.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("coupons_none")}</p>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3 text-sm"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Tag className="h-4 w-4 text-accent" />
                {c.code}
                <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-normal ltr-nums">
                  {c.discount_type === "percent" ? `${c.value}%` : `$${c.value}`}
                </span>
              </span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground ltr-nums">
                {c.min_subtotal > 0 && <span>min ${c.min_subtotal}</span>}
                <span>
                  {c.used_count}
                  {c.max_uses ? `/${c.max_uses}` : ""} {t("coupon_used")}
                </span>
                <button
                  onClick={() => toggle(c)}
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    c.is_active
                      ? "bg-green-500/15 text-green-600 dark:text-green-400"
                      : "bg-secondary"
                  }`}
                >
                  {c.is_active ? t("active") : t("inactive")}
                </button>
                <button
                  onClick={() => remove(c.id)}
                  className="text-destructive hover:opacity-70"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
