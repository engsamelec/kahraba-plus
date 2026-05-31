import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t bg-sidebar text-sidebar-foreground">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-sidebar-foreground/70">{t("footer_about_d")}</p>
        </div>

        <div>
          <h4 className="mb-3 font-semibold">{t("footer_links")}</h4>
          <ul className="space-y-2 text-sm text-sidebar-foreground/70">
            <li>
              <Link to="/" className="hover:text-accent">
                {t("nav_home")}
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-accent">
                {t("nav_shop")}
              </Link>
            </li>
            <li>
              <Link to="/track" className="hover:text-accent">
                {t("nav_track")}
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-accent">
                {t("nav_cart")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold">{t("footer_contact")}</h4>
          <ul className="space-y-2 text-sm text-sidebar-foreground/70">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent" /> +963 900 000 000
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" /> info@kahrabaplus.com
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> Damascus, Syria
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold">{t("brand")}</h4>
          <p className="text-sm text-sidebar-foreground/70">{t("tagline")}</p>
        </div>
      </div>

      <div className="border-t border-sidebar-border">
        <div className="container py-4 text-center text-xs text-sidebar-foreground/60">
          © {year} {t("brand")} — {t("footer_rights")}
        </div>
      </div>
    </footer>
  );
}
