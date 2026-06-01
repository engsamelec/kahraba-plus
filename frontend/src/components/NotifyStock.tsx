import { useState } from "react";
import { BellRing, Check, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/**
 * "Notify me when back in stock" form, shown on out-of-stock products.
 * Captures real demand the merchant can see in the admin.
 */
export function NotifyStock({ productId }: { productId: number }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    try {
      await api.post(`/products/${productId}/notify-stock`, { email: email.trim() });
      setState("done");
    } catch {
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
        <Check className="h-4 w-4" /> {t("notify_done")}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <BellRing className="h-4 w-4 text-accent" />
        {t("notify_title")}
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email")}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <Button
          type="submit"
          disabled={state === "sending"}
          className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {state === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BellRing className="h-4 w-4" />
          )}
          {t("notify_btn")}
        </Button>
      </div>
    </form>
  );
}
