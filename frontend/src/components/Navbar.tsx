import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  Heart,
  LogOut,
  Menu,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  User as UserIcon,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AdminBell } from "./AdminBell";
import { MegaMenu } from "./MegaMenu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { count } = useCart();
  const { count: favCount } = useFavorites();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(search)}`);
    setMobileOpen(false);
  }

  const links = [
    { to: "/", label: t("nav_home") },
    { to: "/shop", label: t("nav_shop") },
    { to: "/offers", label: t("offers_title") },
    { to: "/solar-calculator", label: t("nav_solar") },
    { to: "/favorites", label: t("favorites") },
    { to: "/track", label: t("nav_track") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-safe">
      {/* top strip */}
      <div className="electric-gradient text-primary-foreground">
        <div className="container flex h-8 items-center justify-center text-xs">
          <span>{t("free_ship_banner")}</span>
        </div>
      </div>

      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        {/* search (desktop) */}
        <form
          onSubmit={submitSearch}
          className="relative hidden flex-1 md:block"
        >
          <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
            className="w-full rounded-full border bg-secondary/60 py-2 ltr:pl-10 ltr:pr-11 rtl:pr-10 rtl:pl-11 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <Link
            to="/visual-search"
            title={t("visual_search")}
            aria-label={t("visual_search")}
            className="absolute top-1/2 -translate-y-1/2 ltr:right-2 rtl:left-2 grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent/15 hover:text-accent"
          >
            <Camera className="h-4 w-4" />
          </Link>
        </form>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <span key={l.to} className="flex items-center">
              <Link
                to={l.to}
                aria-current={isActive(l.to) ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(l.to)
                    ? "bg-accent/10 text-accent"
                    : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
              {/* Categories mega-menu sits right after the Shop link */}
              {l.to === "/shop" && <MegaMenu />}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-1 ltr:ml-auto rtl:mr-auto lg:ml-0 lg:mr-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === "dark" ? t("theme_light") : t("theme_dark")}
            aria-label={theme === "dark" ? t("theme_light") : t("theme_dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <LanguageSwitcher />

          <AdminBell />

          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                    {t("nav_admin")}
                  </Button>
                </Link>
              )}
              <Link to="/account">
                <Button variant="ghost" size="icon" title={t("nav_account")}>
                  <UserIcon className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                title={t("nav_logout")}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav_login")}</span>
              </Button>
            </Link>
          )}

          <Link to="/favorites" className="relative hidden sm:block">
            <Button variant="ghost" size="icon" title={t("favorites")}>
              <Heart className="h-5 w-5" />
            </Button>
            {favCount > 0 && (
              <span className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground">
                {favCount}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" title={t("nav_cart")}>
              <ShoppingCart className="h-5 w-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-background lg:hidden">
          <div className="container space-y-3 py-4">
            <form onSubmit={submitSearch} className="relative">
              <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search_placeholder")}
                className="w-full rounded-full border bg-secondary/60 py-2 ltr:pl-10 ltr:pr-11 rtl:pr-10 rtl:pl-11 text-sm outline-none focus:ring-2 focus:ring-accent"
              />
              <Link
                to="/visual-search"
                onClick={() => setMobileOpen(false)}
                aria-label={t("visual_search")}
                className="absolute top-1/2 -translate-y-1/2 ltr:right-2 rtl:left-2 grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:text-accent"
              >
                <Camera className="h-4 w-4" />
              </Link>
            </form>
            <nav className="grid gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(l.to) ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    isActive(l.to)
                      ? "bg-accent/10 text-accent"
                      : "hover:bg-secondary"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
                >
                  {t("nav_admin")}
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
