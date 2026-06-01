import { Logo } from "./Logo";

/** Centered branded fallback shown while a lazy route chunk loads. */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="animate-pulse-soft">
        <Logo />
      </div>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-1/2 animate-loading-bar rounded-full bg-accent" />
      </div>
    </div>
  );
}
