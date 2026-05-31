import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import api, { type Review } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ProductReviews({
  productId,
  initialReviews,
}: {
  productId: number;
  initialReviews: Review[];
}) {
  const { t } = useI18n();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error(t("write_review"));
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/products/${productId}/reviews`, {
        rating,
        user_name: name.trim() || undefined,
        comment: comment.trim() || undefined,
      });
      setReviews((r) => [data, ...r]);
      setOpen(false);
      setRating(0);
      setName("");
      setComment("");
      toast.success(t("submit_review"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-14">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {t("reviews")}
          {reviews.length > 0 && (
            <span className="ms-2 text-sm font-normal text-muted-foreground ltr-nums">
              ({reviews.length})
            </span>
          )}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((v) => !v)}
        >
          {t("write_review")}
        </Button>
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="mb-6 animate-fade-in space-y-4 rounded-xl border bg-card p-5"
        >
          {/* interactive stars */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i}`}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-7 w-7 ${
                    i <= (hover || rating)
                      ? "fill-accent text-accent"
                      : "fill-muted text-muted"
                  }`}
                />
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("full_name")}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={t("write_review")}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <Button
            type="submit"
            disabled={submitting}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {submitting ? t("loading") : t("submit_review")}
          </Button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed py-10 text-center text-muted-foreground">
          {t("no_reviews")}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold">{r.user_name}</span>
                <span className="text-xs text-muted-foreground ltr-nums">
                  {r.created_at?.slice(0, 10)}
                </span>
              </div>
              <div className="mb-2 flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i <= r.rating
                        ? "fill-accent text-accent"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              {r.comment && (
                <p className="text-sm text-muted-foreground">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
