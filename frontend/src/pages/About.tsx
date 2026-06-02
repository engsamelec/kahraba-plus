import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Headphones,
  Mail,
  MapPin,
  Phone,
  Truck,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";

export default function About() {
  const { t } = useI18n();
  const cfg = useConfig();
  useDocumentTitle(t("about_title"));

  const stats = [
    { value: "2,000+", label: t("stat_products") },
    { value: "15K+", label: t("stat_customers") },
    { value: "10+", label: t("stat_years") },
    { value: "24/7", label: t("stat_support") },
  ];

  const values = [
    { icon: BadgeCheck, title: t("feat_genuine"), desc: t("feat_genuine_d") },
    { icon: Truck, title: t("feat_shipping"), desc: t("feat_shipping_d") },
    { icon: Wallet, title: t("feat_cod"), desc: t("feat_cod_d") },
    { icon: Headphones, title: t("feat_support"), desc: t("feat_support_d") },
  ];

  const contacts = [
    {
      icon: Phone,
      value: cfg.store_phone,
      href: `tel:${cfg.store_phone.replace(/[^\d+]/g, "")}`,
      ltr: true,
    },
    { icon: Mail, value: cfg.store_email, href: `mailto:${cfg.store_email}` },
    { icon: MapPin, value: cfg.store_address },
  ];

  return (
    <div>
      {/* hero */}
      <section className="electric-gradient relative overflow-hidden text-primary-foreground">
        <div className="hero-aurora" />
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="container relative py-16 text-center md:py-20">
          <h1 className="text-balance text-3xl font-extrabold md:text-4xl">
            {t("about_title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/80">
            {t("footer_about_d")}
          </p>
        </div>
      </section>

      {/* stats band — overlaps the hero for a polished, raised feel */}
      <section className="container relative z-10 -mt-10">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border shadow-sm lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card p-6 text-center">
              <p className="text-2xl font-extrabold text-accent md:text-3xl ltr-nums">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* story */}
      <section className="container max-w-3xl py-12">
        <h2 className="mb-3 text-xl font-bold">{t("about_story_title")}</h2>
        <p className="leading-relaxed text-foreground/90">{t("about_story")}</p>
      </section>

      {/* values */}
      <section className="bg-secondary/40 py-12">
        <div className="container">
          <h2 className="mb-6 text-center text-xl font-bold">
            {t("about_values_title")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{v.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* contact + CTA */}
      <section className="container grid items-center gap-8 py-14 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold">{t("about_contact_title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("about_contact_d")}</p>
          <ul className="mt-4 space-y-3 text-sm">
            {contacts.map((c) => (
              <li key={c.value} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
                  <c.icon className="h-4 w-4" />
                </span>
                {c.href ? (
                  <a
                    href={c.href}
                    dir={c.ltr ? "ltr" : undefined}
                    className="hover:text-accent"
                  >
                    {c.value}
                  </a>
                ) : (
                  <span>{c.value}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-secondary/40 p-8 text-center">
          <p className="mb-4 text-lg font-semibold">{t("why_us")}</p>
          <Link to="/shop">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {t("hero_cta")}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
