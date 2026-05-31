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
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.round(value);
          return (
            <button
              key={i}
              type="button"
              disabled={!onChange}
              onClick={() => onChange?.(i)}
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
