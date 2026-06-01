import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || subscribing) return;
    setSubscribing(true);
    try {
      await api.post("/subscribe", { email: email.trim() });
      toast.success(t("newsletter_done"));
      setEmail("");
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setSubscribing(false);
    }
  }

  const quickLinks = [
    { to: "/", label: t("nav_home") },
    { to: "/shop", label: t("nav_shop") },
    { to: "/offers", label: t("offers_title") },
    { to: "/about", label: t("about_title") },
  ];
  const serviceLinks = [
    { to: "/track", label: t("nav_track") },
    { to: "/faq", label: t("faq_title") },
    { to: "/cart", label: t("nav_cart") },
    { to: "/account", label: t("my_account") },
  ];
  const socials = [
    { href: BRAND.social.facebook, icon: Facebook, label: "Facebook" },
    { href: BRAND.social.instagram, icon: Instagram, label: "Instagram" },
    { href: BRAND.social.whatsapp, icon: MessageCircle, label: "WhatsApp" },
  ];

  return (
    <footer className="mt-16 border-t bg-sidebar text-sidebar-foreground">
      <div className="container grid gap-10 py-12 md:grid-cols-12">
        {/* Brand + socials */}
        <div className="space-y-4 md:col-span-4">
          <Logo />
          <p className="max-w-xs text-sm text-sidebar-foreground/70">
            {t("footer_about_d")}
          </p>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {t("footer_follow")}
            </p>
            <div className="flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-accent text-sidebar-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="md:col-span-2">
          <h4 className="mb-3 font-semibold">{t("footer_links")}</h4>
          <ul className="space-y-2 text-sm text-sidebar-foreground/70">
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer service */}
        <div className="md:col-span-2">
          <h4 className="mb-3 font-semibold">{t("footer_service")}</h4>
          <ul className="space-y-2 text-sm text-sidebar-foreground/70">
            {serviceLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact + newsletter */}
        <div className="space-y-4 md:col-span-4">
          <div>
            <h4 className="mb-3 font-semibold">{t("footer_contact")}</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <a href={`tel:${BRAND.phoneHref}`} dir="ltr" className="hover:text-accent">
                  {BRAND.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-accent" />
                <a href={`mailto:${BRAND.email}`} className="hover:text-accent">
                  {BRAND.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-accent" /> {BRAND.address}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-1 font-semibold">{t("newsletter_title")}</h4>
            <p className="mb-2 text-xs text-sidebar-foreground/60">
              {t("newsletter_d")}
            </p>
            <form onSubmit={subscribe} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("newsletter_placeholder")}
                className="min-w-0 flex-1 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={subscribing}
                aria-label={t("newsletter_subscribe")}
                className="grid w-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-sidebar-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-4 text-xs text-sidebar-foreground/60 sm:flex-row">
          <span>
            © {year} {t("brand")} — {t("footer_rights")}
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" /> {t("pay_card")}
            </span>
            <span className="h-3 w-px bg-sidebar-border" />
            <span className="flex items-center gap-1.5">
              <Truck className="h-4 w-4" /> {t("pay_cod")}
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
