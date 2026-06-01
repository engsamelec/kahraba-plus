import { useState } from "react";
import { Cpu, Zap } from "lucide-react";

/**
 * Branded hero visual. Tries a product photo, but always renders a
 * self-contained circuit illustration underneath so the hero never looks
 * broken when an external image is slow or blocked.
 */
export function HeroShowcase() {
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="relative hidden items-center justify-center md:flex">
      <div className="float-slow relative h-72 w-72 lg:h-80 lg:w-80">
        {/* glow ring */}
        <div className="absolute inset-0 rounded-3xl bg-accent/20 blur-2xl" />

        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-[hsl(222_47%_13%)] shadow-2xl">
          {/* circuit illustration (always present) */}
          <svg
            className="absolute inset-0 h-full w-full opacity-40"
            viewBox="0 0 320 320"
            fill="none"
            aria-hidden="true"
          >
            <g stroke="hsl(38 92% 50%)" strokeWidth="1.5" opacity="0.6">
              <path d="M20 60 H120 V140 H220" />
              <path d="M60 20 V100 H160 V300" />
              <path d="M300 80 H200 V200 H80" />
              <path d="M40 260 H180 V180" />
            </g>
            <g fill="hsl(38 92% 50%)">
              {[
                [120, 140],
                [160, 100],
                [200, 200],
                [180, 180],
                [60, 100],
                [220, 140],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="4" />
              ))}
            </g>
          </svg>

          {/* product photo on top when it loads */}
          {imgOk && (
            <img
              src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=700&q=80"
              alt="electronics"
              fetchPriority="high"
              onError={() => setImgOk(false)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* central chip badge — the brand anchor */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-lg amber-glow">
              <Cpu className="h-10 w-10" />
            </div>
          </div>
        </div>

        {/* floating spark chips */}
        <div className="absolute -left-4 top-6 grid h-12 w-12 animate-pulse-soft place-items-center rounded-xl bg-background/90 text-accent shadow-lg ring-1 ring-border">
          <Zap className="h-6 w-6" fill="currentColor" />
        </div>
        <div className="absolute -bottom-3 right-8 grid h-10 w-10 place-items-center rounded-xl bg-background/90 text-primary shadow-lg ring-1 ring-border">
          <Cpu className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
