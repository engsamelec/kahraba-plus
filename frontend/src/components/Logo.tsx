import { Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Logo({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground amber-glow">
        <Zap className="h-5 w-5" fill="currentColor" />
      </span>
      <div className="leading-tight">
        <span className="block text-lg font-extrabold tracking-tight">
          {lang === "ar" ? "كهربا بلس" : "Kahraba+"}
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-widest text-accent">
          Electronics
        </span>
      </div>
    </div>
  );
}
