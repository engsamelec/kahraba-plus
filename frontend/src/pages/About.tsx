import { Link } from "react-router-dom";
import { BadgeCheck, Headphones, Truck, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";

export default function About() {
  const { t } = useI18n();
  useDocumentTitle(t("about_title"));

  const values = [
    { icon: BadgeCheck, title: t("feat_genuine"), desc: t("feat_genuine_d") },
    { icon: Truck, title: t("feat_shipping"), desc: t("feat_shipping_d") },
    { icon: Wallet, title: t("feat_cod"), desc: t("feat_cod_d") },
    { icon: Headphones, title: t("feat_support"), desc: t("feat_support_d") },
  ];

  return (
    <div>
      {/* hero */}
      <section className="electric-gradient relative overflow-hidden text-primary-foreground">
        <div className="hero-aurora" />
        <div className="container relative py-16 text-center">
          <h1 className="text-balance text-3xl font-extrabold md:text-4xl">
            {t("about_title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/80">
            {t("footer_about_d")}
          </p>
        </div>
      </section>

      {/* story */}
      <section className="container max-w-3xl py-12">
        <h2 className="mb-3 text-xl font-bold">{t("about_story_title")}</h2>
        <p className="leading-relaxed text-foreground/90">{t("about_story")}</p>
      </section>

      {/* values */}
      <section className="bg-secondary/40 py-12">
        <div className="container grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-xl border bg-card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold">{v.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-12 text-center">
        <Link to="/shop">
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            {t("hero_cta")}
          </Button>
        </Link>
      </section>
    </div>
  );
}
