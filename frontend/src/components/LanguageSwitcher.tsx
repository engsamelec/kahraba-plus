import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { LANGS, useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = LANGS.find((l) => l.code === lang);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="gap-1.5"
        title="Language"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs font-semibold">{current?.label}</span>
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute z-50 mt-1 min-w-36 overflow-hidden rounded-lg border bg-popover py-1 shadow-lg ltr:right-0 rtl:left-0"
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              role="menuitemradio"
              aria-checked={l.code === lang}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              dir={l.dir}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-sm transition-colors hover:bg-secondary ${
                l.code === lang ? "font-semibold text-accent" : ""
              }`}
            >
              <span>{l.label}</span>
              {l.code === lang && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
