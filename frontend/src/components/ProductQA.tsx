import { useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface QA {
  id: number;
  asker_name: string;
  body: string;
  answer: string | null;
  created_at?: string;
}

export function ProductQA({ productId }: { productId: number }) {
  const { t } = useI18n();
  const [items, setItems] = useState<QA[]>([]);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get(`/products/${productId}/questions`)
      .then((r) => setItems(r.data))
      .catch(() => {});
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 3) return;
    setSending(true);
    try {
      await api.post(`/products/${productId}/questions`, {
        body: body.trim(),
        name: name.trim() || undefined,
      });
      setBody("");
      setName("");
      setOpen(false);
      toast.success(t("qa_sent"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MessagesSquare className="h-5 w-5 text-accent" />
          {t("qa_title")}
          {items.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ltr-nums">
              ({items.length})
            </span>
          )}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          {t("qa_ask")}
        </Button>
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="mb-5 space-y-3 rounded-xl border bg-card p-4"
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={t("qa_placeholder")}
            className="w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("full_name")}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
            <Button
              type="submit"
              disabled={sending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {t("qa_submit")}
            </Button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
          {t("qa_empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((q) => (
            <div key={q.id} className="rounded-xl border bg-card p-4">
              <p className="flex gap-2 text-sm font-medium">
                <span className="text-accent">Q:</span>
                <span>{q.body}</span>
              </p>
              {q.answer && (
                <p className="mt-2 flex gap-2 border-t pt-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    A:
                  </span>
                  <span>{q.answer}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
