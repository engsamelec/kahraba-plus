import { useEffect, useState } from "react";
import { Loader2, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";

interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at?: string | null;
}

export function UsersAdmin() {
  const { t } = useI18n();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  function load(q = "") {
    setLoading(true);
    api
      .get("/admin/users", { params: q ? { search: q } : {} })
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  }
  useEffect(() => load(), []);

  async function setRole(u: AdminUser, role: string) {
    setBusy(u.id);
    try {
      const { data } = await api.put(`/admin/users/${u.id}/role`, { role });
      setUsers((xs) => xs.map((x) => (x.id === u.id ? { ...x, role: data.role } : x)));
      toast.success(t("save"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-lg font-bold">{t("admin_users")}</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="relative max-w-sm"
      >
        <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin_users_search")}
          className="w-full rounded-lg border bg-background py-2 ltr:pl-9 rtl:pr-9 px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </form>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isAdmin = u.role === "admin";
            const isSelf = me?.id === u.id;
            return (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {`${u.first_name} ${u.last_name}`.trim() || u.email}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {u.email}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isAdmin
                        ? "bg-accent/15 text-accent"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {isAdmin ? t("role_admin") : t("role_customer")}
                  </span>
                  {/* can't change own role (no self-lockout) */}
                  {!isSelf &&
                    (isAdmin ? (
                      <button
                        onClick={() => setRole(u, "customer")}
                        disabled={busy === u.id}
                        className="flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
                      >
                        <ShieldOff className="h-3.5 w-3.5" /> {t("demote")}
                      </button>
                    ) : (
                      <button
                        onClick={() => setRole(u, "admin")}
                        disabled={busy === u.id}
                        className="flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> {t("promote")}
                      </button>
                    ))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
