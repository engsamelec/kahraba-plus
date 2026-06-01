import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";

interface Props {
  urls: string[];
  hashes: (number | string)[];
  onChange: (urls: string[], hashes: (number | string)[]) => void;
}

/**
 * Multi-image manager for the product editor. Uploads files to /api/uploads
 * (which returns a URL + perceptual hash per image), supports several images,
 * lets the admin reorder (first = primary) and remove. Also accepts pasting an
 * external image URL.
 */
export function ImageUploader({ urls, hashes, onChange }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [urlField, setUrlField] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const dataUrls = await Promise.all(
        Array.from(files).map(
          (f) =>
            new Promise<string>((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result as string);
              r.onerror = reject;
              r.readAsDataURL(f);
            })
        )
      );
      const { data } = await api.post("/uploads", { images: dataUrls });
      const newUrls = [...urls];
      const newHashes = [...hashes];
      for (const u of data.uploaded as { url: string; hash: number | null }[]) {
        newUrls.push(u.url);
        newHashes.push(u.hash ?? "");
      }
      onChange(newUrls, newHashes);
      toast.success(t("images_uploaded"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(i: number) {
    onChange(
      urls.filter((_, idx) => idx !== i),
      hashes.filter((_, idx) => idx !== i)
    );
  }

  function makePrimary(i: number) {
    if (i === 0) return;
    const u = [...urls];
    const h = [...hashes];
    const [pu] = u.splice(i, 1);
    const [ph] = h.splice(i, 1);
    u.unshift(pu);
    h.unshift(ph);
    onChange(u, h);
  }

  function addUrl() {
    const v = urlField.trim();
    if (!v) return;
    // External URL: no client-side hash (server can reindex later).
    onChange([...urls, v], [...hashes, ""]);
    setUrlField("");
  }

  return (
    <div className="sm:col-span-2">
      <label className="mb-1 block text-sm font-medium">{t("images")}</label>

      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div
            key={url + i}
            className="group relative h-24 w-24 overflow-hidden rounded-lg border bg-secondary"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                {t("primary_image")}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
              {i !== 0 ? (
                <button
                  type="button"
                  title={t("make_primary")}
                  onClick={() => makePrimary(i)}
                  className="text-white hover:text-accent"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                title={t("remove")}
                onClick={() => removeAt(i)}
                className="text-white hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="grid h-24 w-24 place-items-center rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-accent hover:text-accent"
        >
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onFiles(e.target.files)}
        className="hidden"
      />

      {/* optional external URL */}
      <div className="mt-2 flex gap-2">
        <input
          placeholder="https://… (optional image URL)"
          value={urlField}
          onChange={(e) => setUrlField(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={addUrl}
          className="rounded-lg border px-3 text-sm hover:bg-secondary"
        >
          +
        </button>
      </div>
    </div>
  );
}
