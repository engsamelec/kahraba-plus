import { Link, Navigate, Outlet } from "react-router-dom";
import { ExternalLink, LayoutDashboard, LogOut, Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";

/**
 * Isolated admin shell — its own top bar, no storefront chrome (no promo
 * strip, search, cart, mega-menu, footer or mobile tab bar). Admin-only:
 * non-admins are redirected. Everything inside is the control panel.
 */
export function AdminLayout() {
  const { t } = useI18n();
  const { user, loading, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/30">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }
  // Hard gate: only admins reach the panel.
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <header className="sticky top-0 z-40 border-b bg-card pt-safe">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <span className="flex items-center gap-2 font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
              <LayoutDashboard className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">{t("admin_dashboard")}</span>
          </span>

          <div className="flex items-center gap-1 ltr:ml-auto rtl:mr-auto">
            <Link
              to="/"
              title={t("admin_view_site")}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin_view_site")}</span>
            </Link>
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t("theme_light") : t("theme_dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title={t("nav_logout")}
              aria-label={t("nav_logout")}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
