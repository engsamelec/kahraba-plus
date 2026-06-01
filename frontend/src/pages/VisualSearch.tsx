import { useRef, useState } from "react";
import { Camera, Loader2, Upload, X } from "lucide-react";
import api, { type Product } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

type State = "idle" | "searching" | "done" | "error";

export default function VisualSearch() {
  const { t } = useI18n();
  useDocumentTitle(t("visual_search"));
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<State>("idle");
  const [results, setResults] = useState<Product[]>([]);

  function pick() {
    inputRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      search(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function search(dataUrl: string) {
    setState("searching");
    setResults([]);
    try {
      const { data } = await api.post("/visual-search", { image: dataUrl });
      setResults(data.results ?? []);
      setState("done");
    } catch {
      setState("error");
    }
  }

  function reset() {
    setPreview(null);
    setResults([]);
    setState("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6 text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold">
          <Camera className="h-6 w-6 text-accent" />
          {t("visual_search")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("visual_search_hint")}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className="hidden"
      />

      {!preview ? (
        <button
          onClick={pick}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-16 text-muted-foreground transition-colors hover:border-accent hover:bg-accent/5"
        >
          <Upload className="h-10 w-10" />
          <span className="font-medium">{t("visual_search_upload")}</span>
          <span className="text-xs">JPG · PNG · WEBP</span>
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={preview}
              alt=""
              className="max-h-56 rounded-xl border object-contain"
            />
            <button
              onClick={reset}
              aria-label={t("remove")}
              className="absolute -top-2 ltr:-right-2 rtl:-left-2 grid h-7 w-7 place-items-center rounded-full bg-destructive text-destructive-foreground shadow"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={pick}>
            {t("visual_search_another")}
          </Button>
        </div>
      )}

      <div className="mt-8">
        {state === "searching" && (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <span>{t("visual_search_matching")}</span>
          </div>
        )}

        {state === "error" && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
            {t("error_generic")}
          </p>
        )}

        {state === "done" && results.length === 0 && (
          <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            {t("visual_search_none")}
          </p>
        )}

        {results.length > 0 && (
          <>
            <h2 className="mb-4 text-lg font-bold">
              {t("visual_search_results")}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((p) => (
                <div key={p.id} className="relative">
                  {typeof p.match_score === "number" && (
                    <span className="absolute top-2 ltr:left-2 rtl:right-2 z-10 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                      {Math.round(p.match_score * 100)}%
                    </span>
                  )}
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
