import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, HelpCircle, PackageX, ShoppingBag } from "lucide-react";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface Counts {
  pending_orders: number;
  unanswered_questions: number;
  restock_requests: number;
  low_stock: number;
  total: number;
}

/**
 * Admin-only notification bell: shows a badge with the number of things needing
 * attention (pending orders, unanswered questions, restock requests) and a
 * dropdown linking into the relevant admin tab. Polls every 60s.
 */
export function AdminBell() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    const load = () =>
      api
        .get("/admin/notifications")
        .then((r) => alive && setCounts(r.data))
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [isAdmin]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!isAdmin || !counts) return null;

  const rows = [
    { icon: ShoppingBag, label: t("notif_pending_orders"), n: counts.pending_orders, to: "/admin" },
    { icon: HelpCircle, label: t("notif_questions"), n: counts.unanswered_questions, to: "/admin" },
    { icon: PackageX, label: t("notif_restock"), n: counts.restock_requests, to: "/admin" },
  ].filter((r) => r.n > 0);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        title={t("notifications")}
        aria-label={t("notifications")}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {counts.total > 0 && (
          <span className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground">
            {counts.total}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-64 overflow-hidden rounded-lg border bg-popover py-1 shadow-lg ltr:right-0 rtl:left-0">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">
            {t("notifications")}
          </p>
          {rows.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              {t("notif_none")}
            </p>
          ) : (
            rows.map((r) => (
              <Link
                key={r.label}
                to={r.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <r.icon className="h-4 w-4 text-accent" />
                  {r.label}
                </span>
                <span className="ltr-nums rounded-full bg-accent/15 px-2 text-xs font-bold text-accent">
                  {r.n}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
