import { useEffect, useState } from "react";
import { Loader2, MapPin, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import api, { type Address } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const EMPTY = {
  full_name: "",
  phone: "",
  address_line1: "",
  city: "",
  country: "Syria",
  is_default: false,
};

/** Saved-address management for the account page. */
export function AddressBook() {
  const { t } = useI18n();
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/auth/me/addresses")
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function add() {
    if (!draft) return;
    if (!draft.full_name.trim() || !draft.address_line1.trim() || !draft.city.trim()) {
      toast.error(t("address_incomplete"));
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/me/addresses", draft);
      setDraft(null);
      load();
      toast.success(t("save"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      await api.delete(`/auth/me/addresses/${id}`);
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    }
  }

  const cell =
    "rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{t("saved_addresses")}</h2>
        {!draft && (
          <Button
            onClick={() => setDraft({ ...EMPTY })}
            className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" /> {t("add_address")}
          </Button>
        )}
      </div>

      {draft && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border bg-secondary/30 p-4">
          <input
            placeholder={t("full_name")}
            className={cell}
            value={draft.full_name}
            onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
          />
          <input
            placeholder={t("phone")}
            dir="ltr"
            className={cell}
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
          />
          <input
            placeholder={t("address")}
            className={`${cell} col-span-2`}
            value={draft.address_line1}
            onChange={(e) => setDraft({ ...draft, address_line1: e.target.value })}
          />
          <input
            placeholder={t("city")}
            className={cell}
            value={draft.city}
            onChange={(e) => setDraft({ ...draft, city: e.target.value })}
          />
          <input
            placeholder={t("country")}
            className={cell}
            value={draft.country}
            onChange={(e) => setDraft({ ...draft, country: e.target.value })}
          />
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.is_default}
              onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })}
              className="h-4 w-4 accent-[hsl(var(--accent))]"
            />
            {t("set_default_address")}
          </label>
          <div className="col-span-2 flex gap-2">
            <Button
              onClick={add}
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
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          {t("no_addresses")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((a) => (
            <div key={a.id} className="relative rounded-xl border bg-card p-4 text-sm">
              {a.is_default && (
                <span className="absolute top-3 ltr:right-3 rtl:left-3 flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                  <Star className="h-3 w-3" /> {t("default_address")}
                </span>
              )}
              <p className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-accent" /> {a.full_name}
              </p>
              <p className="mt-1 text-muted-foreground">
                {a.address_line1}, {a.city}, {a.country}
              </p>
              {a.phone && (
                <p className="text-muted-foreground ltr-nums">{a.phone}</p>
              )}
              <button
                onClick={() => remove(a.id)}
                className="mt-2 flex items-center gap-1 text-xs text-destructive hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("remove")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
