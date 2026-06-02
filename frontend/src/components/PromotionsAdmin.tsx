import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import api, { type Promotion } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const EMPTY = {
  title: "",
  title_ar: "",
  title_he: "",
  subtitle: "",
  subtitle_ar: "",
  subtitle_he: "",
  image_url: "",
  coupon_code: "",
  cta_link: "/offers",
  starts_at: "",
  ends_at: "",
  sort_order: "",
};

export function PromotionsAdmin() {
  const { t } = useI18n();
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/admin/promotions")
      .then((r) => setItems(r.data))
      .catch((err) => toast.error(getErrorMessage(err) ?? t("error_generic")))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function startEdit(p: Promotion) {
    setEditId(p.id);
    setDraft({
      title: p.title || "",
      title_ar: p.title_ar || "",
      title_he: p.title_he || "",
      subtitle: p.subtitle || "",
      subtitle_ar: p.subtitle_ar || "",
      subtitle_he: p.subtitle_he || "",
      image_url: p.image_url || "",
      coupon_code: p.coupon_code || "",
      cta_link: p.cta_link || "/offers",
      starts_at: p.starts_at ? p.starts_at.slice(0, 10) : "",
      ends_at: p.ends_at ? p.ends_at.slice(0, 10) : "",
      sort_order: p.sort_order != null ? String(p.sort_order) : "",
    });
  }

  function cancelEdit() {
    setEditId(null);
    setDraft({ ...EMPTY });
  }

  async function save() {
    if (!draft.title_ar.trim() && !draft.title.trim()) {
      toast.error(t("promo_need_title"));
      return;
    }
    setSaving(true);
    const payload = {
      ...draft,
      title: draft.title || draft.title_ar,
      sort_order: draft.sort_order ? Number(draft.sort_order) : 0,
    };
    try {
      if (editId) await api.put(`/admin/promotions/${editId}`, payload);
      else await api.post("/admin/promotions", payload);
      cancelEdit();
      load();
      toast.success(t("save"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(p: Promotion) {
    try {
      await api.put(`/admin/promotions/${p.id}`, { is_active: !p.is_active });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    }
  }
  async function remove(id: number) {
    if (!confirm(`${t("delete")}?`)) return;
    try {
      await api.delete(`/admin/promotions/${id}`);
      setItems((xs) => xs.filter((x) => x.id !== id));
      toast.success(t("delete"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    }
  }

  const cell =
    "rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-bold">{t("promos_title")}</h2>
        <p className="text-sm text-muted-foreground">{t("promos_hint")}</p>
      </div>

      {/* create / edit */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border bg-secondary/30 p-4">
        <input
          placeholder={t("promo_title_ar")}
          dir="rtl"
          className={cell}
          value={draft.title_ar}
          onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })}
        />
        <input
          placeholder={t("promo_title_en")}
          className={cell}
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <input
          placeholder={`${t("promo_subtitle")} (ar)`}
          dir="rtl"
          className={`${cell} col-span-2`}
          value={draft.subtitle_ar}
          onChange={(e) => setDraft({ ...draft, subtitle_ar: e.target.value })}
        />
        <input
          placeholder={`${t("promo_subtitle")} (en)`}
          className={cell}
          value={draft.subtitle}
          onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
        />
        <input
          placeholder={`${t("promo_subtitle")} (he)`}
          dir="rtl"
          className={cell}
          value={draft.subtitle_he}
          onChange={(e) => setDraft({ ...draft, subtitle_he: e.target.value })}
        />
        <input
          placeholder={t("promo_coupon")}
          className={cell}
          value={draft.coupon_code}
          onChange={(e) => setDraft({ ...draft, coupon_code: e.target.value })}
        />
        <input
          placeholder={t("promo_link")}
          dir="ltr"
          className={cell}
          value={draft.cta_link}
          onChange={(e) => setDraft({ ...draft, cta_link: e.target.value })}
        />
        <input
          placeholder={t("promo_image")}
          dir="ltr"
          className={cell}
          value={draft.image_url}
          onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
        />
        <input
          placeholder={t("promo_sort")}
          inputMode="numeric"
          className={cell}
          value={draft.sort_order}
          onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
        />
        <label className="text-xs text-muted-foreground">
          {t("promo_starts")}
          <input
            type="date"
            className={`${cell} mt-1 w-full`}
            value={draft.starts_at}
            onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          {t("promo_ends")}
          <input
            type="date"
            className={`${cell} mt-1 w-full`}
            value={draft.ends_at}
            onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
          />
        </label>
        <div className="col-span-2 flex gap-2">
          <Button
            onClick={save}
            disabled={saving}
            className="flex-1 gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {editId ? t("save") : t("add")}
          </Button>
          {editId && (
            <Button variant="outline" onClick={cancelEdit} className="gap-1">
              <X className="h-4 w-4" /> {t("cancel")}
            </Button>
          )}
        </div>
      </div>

      {/* list */}
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("promos_none")}</p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3 text-sm"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Tag className="h-4 w-4 text-accent" />
                {p.title_ar || p.title}
                {p.coupon_code && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-normal">
                    {p.coupon_code}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-3 text-xs">
                {p.live && (
                  <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-green-600 dark:text-green-400">
                    {t("promo_live")}
                  </span>
                )}
                <button
                  onClick={() => toggle(p)}
                  className={`rounded-full px-2 py-0.5 ${
                    p.is_active
                      ? "bg-accent/15 text-accent"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {p.is_active ? t("active") : t("inactive")}
                </button>
                <button
                  onClick={() => startEdit(p)}
                  aria-label={t("edit")}
                  className="text-muted-foreground hover:text-accent"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(p.id)}
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
    </div>
  );
}
