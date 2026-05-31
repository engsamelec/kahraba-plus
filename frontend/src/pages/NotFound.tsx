import { Link } from "react-router-dom";
import { Home, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t, lang } = useI18n();
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-6">
        <span className="text-[7rem] font-extrabold leading-none text-secondary">
          404
        </span>
        <Zap className="absolute inset-0 m-auto h-16 w-16 animate-pulse-soft text-accent" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">
        {lang === "ar" ? "الصفحة غير موجودة" : "Page not found"}
      </h1>
      <p className="mb-6 max-w-sm text-muted-foreground">
        {lang === "ar"
          ? "يبدو أن هذا الرابط مقطوع أو أن الصفحة لم تعد متاحة."
          : "This link looks broken or the page is no longer available."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/">
          <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Home className="h-4 w-4" />
            {t("nav_home")}
          </Button>
        </Link>
        <Link to="/shop">
          <Button variant="outline">{t("nav_shop")}</Button>
        </Link>
      </div>
    </div>
  );
}
