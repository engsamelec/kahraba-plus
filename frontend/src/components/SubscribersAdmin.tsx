import { useEffect, useState } from "react";
import { Download, Loader2, Mail } from "lucide-react";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface Subscriber {
  id: number;
  email: string;
  created_at?: string | null;
}

export function SubscribersAdmin() {
  const { t } = useI18n();
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/subscribers")
      .then((r) => setSubs(r.data))
      .finally(() => setLoading(false));
  }, []);

  function exportCsv() {
    const rows = [
      ["email", "subscribed_at"],
      ...subs.map((s) => [s.email, s.created_at?.slice(0, 10) ?? ""]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-accent" />;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {t("admin_subscribers")}{" "}
          <span className="font-normal text-muted-foreground ltr-nums">
            ({subs.length})
          </span>
        </h2>
        {subs.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-secondary"
          >
            <Download className="h-4 w-4" /> {t("export_csv")}
          </button>
        )}
      </div>

      {subs.length === 0 ? (
        <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          {t("no_subscribers")}
        </p>
      ) : (
        <div className="divide-y rounded-xl border bg-card">
          {subs.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" /> {s.email}
              </span>
              <span className="text-xs text-muted-foreground ltr-nums">
                {s.created_at?.slice(0, 10)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
