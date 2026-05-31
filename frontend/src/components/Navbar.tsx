import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User as UserIcon,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const { t, toggleLang, lang } = useI18n();
  const { count } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(search)}`);
    setMobileOpen(false);
  }

  const links = [
    { to: "/", label: t("nav_home") },
    { to: "/shop", label: t("nav_shop") },
    { to: "/track", label: t("nav_track") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* top strip */}
      <div className="electric-gradient text-primary-foreground">
        <div className="container flex h-8 items-center justify-center text-xs">
          <span>
            {lang === "ar"
              ? "🚚 شحن مجاني للطلبات فوق 100$ — محلياً ودولياً"
              : "🚚 Free shipping on orders over $100 — local & worldwide"}
          </span>
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
            className="w-full rounded-full border bg-secondary/60 py-2 ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
        </form>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 ltr:ml-auto rtl:mr-auto lg:ml-0 lg:mr-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            className="gap-1.5"
            title="Language"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-semibold">
              {lang === "ar" ? "EN" : "ع"}
            </span>
          </Button>

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
                className="w-full rounded-full border bg-secondary/60 py-2 ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 text-sm outline-none focus:ring-2 focus:ring-accent"
              />
            </form>
            <nav className="grid gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
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
