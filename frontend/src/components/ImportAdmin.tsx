import { useRef, useState } from "react";
import { Download, FileUp, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import api, { getToken, API_BASE_URL } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Preview {
  total_rows: number;
  valid: number;
  errors: { row: number; error: string }[];
  detected_columns: string[];
  sample: Record<string, string>[];
}

const SAMPLE_CSV = `name,name_ar,sku,price,stock,category,featured
LED Strip 5m,شريط ليد 5 متر,LED-5M,7.50,40,Lighting,yes
USB-C Cable,كابل USB-C,USBC-1,3.00,100,Components & Tools,no`;

export function ImportAdmin() {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsv(reader.result as string);
      setPreview(null);
      setResult(null);
    };
    reader.readAsText(file);
  }

  async function exportCsv() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/export`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kahraba-catalog.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    }
  }

  async function doPreview() {
    if (!csv.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const { data } = await api.post("/admin/import/preview", { csv });
      setPreview(data);
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  async function doCommit() {
    setBusy(true);
    try {
      const { data } = await api.post("/admin/import/commit", { csv });
      setResult(data);
      setPreview(null);
      toast.success(t("import_done"));
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-bold">{t("import_csv")}</h2>
        <p className="text-sm text-muted-foreground">{t("import_hint")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="hidden"
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
          <FileUp className="h-4 w-4" /> {t("import_choose_file")}
        </Button>
        <Button variant="outline" onClick={exportCsv} className="gap-2">
          <Download className="h-4 w-4" /> {t("export_csv")}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setCsv(SAMPLE_CSV);
            setPreview(null);
            setResult(null);
          }}
        >
          {t("import_sample")}
        </Button>
      </div>

      <textarea
        value={csv}
        onChange={(e) => {
          setCsv(e.target.value);
          setPreview(null);
          setResult(null);
        }}
        rows={8}
        dir="ltr"
        placeholder="name,price,stock,category…"
        className="w-full rounded-lg border bg-background p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-accent"
      />

      <div className="flex gap-2">
        <Button onClick={doPreview} disabled={busy || !csv.trim()} variant="outline" className="gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("import_preview")}
        </Button>
        {preview && preview.valid > 0 && (
          <Button onClick={doCommit} disabled={busy} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <UploadCloud className="h-4 w-4" />
            {t("import_commit")} ({preview.valid})
          </Button>
        )}
      </div>

      {preview && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>{t("import_total")}: <b className="ltr-nums">{preview.total_rows}</b></span>
            <span className="text-green-600 dark:text-green-400">
              {t("import_valid")}: <b className="ltr-nums">{preview.valid}</b>
            </span>
            {preview.errors.length > 0 && (
              <span className="text-destructive">
                {t("import_errors")}: <b className="ltr-nums">{preview.errors.length}</b>
              </span>
            )}
          </div>
          {preview.detected_columns.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("import_columns")}: {preview.detected_columns.join(", ")}
            </p>
          )}
          {preview.errors.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-destructive">
              {preview.errors.slice(0, 8).map((e, i) => (
                <li key={i}>
                  {t("import_row")} {e.row}: {e.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm">
          <p className="font-semibold">{t("import_done")}</p>
          <p className="ltr-nums mt-1">
            +{result.created} {t("import_created")} · {result.updated}{" "}
            {t("import_updated")} · {result.skipped} {t("import_skipped")}
          </p>
        </div>
      )}
    </div>
  );
}
