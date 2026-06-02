import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import api, { type Category } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { CategoryIcon } from "@/lib/categoryIcons";
import { Button } from "@/components/ui/button";

interface Draft {
  id?: number;
  name: string;
  name_ar: string;
  name_he: string;
  icon: string;
  description: string;
  parent_id: string;
}

const EMPTY: Draft = {
  name: "",
  name_ar: "",
  name_he: "",
  icon: "",
  description: "",
  parent_id: "",
};

export function CategoriesAdmin() {
  const { t } = useI18n();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/categories")
      .then((r) => setItems(r.data))
      .catch((err) => toast.error(getErrorMessage(err) ?? t("error_generic")))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function save() {
    if (!draft) return;
    if (!draft.name.trim() && !draft.name_ar.trim()) {
      toast.error(t("cat_need_name"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...draft,
        name: draft.name || draft.name_ar,
        parent_id: draft.parent_id ? Number(draft.parent_id) : null,
      };
      if (draft.id) await api.put(`/categories/${draft.id}`, payload);
      else await api.post("/categories", payload);
      setDraft(null);
      load();
      toast.success(t("save"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Category) {
    if (!confirm(`${t("delete")} «${c.name_ar || c.name}»?`)) return;
    try {
      await api.delete(`/categories/${c.id}`);
      setItems((xs) => xs.filter((x) => x.id !== c.id));
      toast.success(t("delete"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    }
  }

  const cell =
    "rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("admin_categories")}</h2>
        {!draft && (
          <Button
            onClick={() => setDraft({ ...EMPTY })}
            className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" /> {t("add")}
          </Button>
        )}
      </div>

      {draft && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border bg-secondary/30 p-4">
          <input
            placeholder={`${t("name")} (ar)`}
            dir="rtl"
            className={cell}
            value={draft.name_ar}
            onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })}
          />
          <input
            placeholder={`${t("name")} (en)`}
            className={cell}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <input
            placeholder={`${t("name")} (he)`}
            dir="rtl"
            className={cell}
            value={draft.name_he}
            onChange={(e) => setDraft({ ...draft, name_he: e.target.value })}
          />
          <input
            placeholder={t("cat_icon")}
            dir="ltr"
            className={cell}
            value={draft.icon}
            onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
          />
          <select
            aria-label={t("cat_parent")}
            className={cell}
            value={draft.parent_id}
            onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })}
          >
            <option value="">{t("cat_no_parent")}</option>
            {items
              .filter((c) => c.id !== draft.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar || c.name}
                </option>
              ))}
          </select>
          <input
            placeholder={t("cat_description")}
            className={`${cell} col-span-2`}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <div className="col-span-2 flex gap-2">
            <Button
              onClick={save}
              disabled={saving}
              className="flex-1 gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("save")}
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)} className="gap-1">
              <X className="h-4 w-4" /> {t("cancel")}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-xl border bg-card p-3 text-sm"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
                  <CategoryIcon name={c.icon} />
                </span>
                <span>
                  <span className="block font-semibold">{c.name_ar || c.name}</span>
                  <span className="block text-xs text-muted-foreground ltr-nums">
                    {c.product_count ?? 0} · {c.slug}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setDraft({
                      id: c.id,
                      name: c.name,
                      name_ar: c.name_ar || "",
                      name_he: c.name_he || "",
                      icon: c.icon || "",
                      description: c.description || "",
                      parent_id: c.parent_id != null ? String(c.parent_id) : "",
                    })
                  }
                  className="text-muted-foreground hover:text-accent"
                  aria-label={t("edit")}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(c)}
                  className="text-destructive hover:opacity-70"
                  aria-label={t("delete")}
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
