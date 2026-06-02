import { Star } from "lucide-react";

export function StarRating({
  value,
  count,
  size = 14,
  onChange,
}: {
  value: number;
  count?: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <div
        className="flex"
        role={onChange ? "radiogroup" : "img"}
        aria-label={
          onChange ? "Rating" : `${Math.round(value)} out of 5 stars`
        }
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.round(value);
          return (
            <button
              key={i}
              type="button"
              disabled={!onChange}
              onClick={() => onChange?.(i)}
              role={onChange ? "radio" : undefined}
              aria-checked={onChange ? i === Math.round(value) : undefined}
              aria-label={onChange ? `${i} stars` : undefined}
              className={onChange ? "cursor-pointer" : "cursor-default"}
            >
              <Star
                style={{ width: size, height: size }}
                className={
                  filled
                    ? "fill-accent text-accent"
                    : "fill-transparent text-muted-foreground/40"
                }
              />
            </button>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
