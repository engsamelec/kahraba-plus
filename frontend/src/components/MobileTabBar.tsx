import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

export function MobileTabBar() {
  const { t } = useI18n();
  const { count } = useCart();
  const { pathname } = useLocation();

  const tabs = [
    { to: "/", icon: Home, label: t("nav_home") },
    { to: "/shop", icon: LayoutGrid, label: t("nav_shop") },
    { to: "/cart", icon: ShoppingCart, label: t("nav_cart"), badge: count },
    { to: "/account", icon: User, label: t("nav_account") },
  ];

  function isActive(to: string) {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-4">
        {tabs.map((tab) => {
          const active = isActive(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <span className="relative">
                <tab.icon className="h-5 w-5" />
                {tab.badge ? (
                  <span className="absolute -top-1.5 ltr:-right-2 rtl:-left-2 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                    {tab.badge}
                  </span>
                ) : null}
              </span>
              {tab.label}
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
