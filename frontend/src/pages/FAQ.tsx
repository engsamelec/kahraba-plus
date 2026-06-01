import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function FAQ() {
  const { t } = useI18n();
  useDocumentTitle(t("faq_title"));
  const [open, setOpen] = useState<number | null>(0);

  // Six common questions, all from the i18n dictionary.
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({
    q: t(`faq_q${n}`),
    a: t(`faq_a${n}`),
  }));

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-6 text-center text-2xl font-bold">{t("faq_title")}</h1>
      <div className="space-y-2">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start text-sm font-medium hover:bg-secondary/50"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-accent transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <p className="border-t px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
