import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { t } = useI18n();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  useDocumentTitle(mode === "login" ? t("login_title") : t("register_title"));
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      toast.success(t("brand"));
      navigate("/account");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t("error_generic"));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="container grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-6 text-center text-xl font-bold">
          {mode === "login" ? t("login_title") : t("register_title")}
        </h1>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder={t("full_name")}
                className={inputCls}
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
              />
              <input
                placeholder={t("phone")}
                className={inputCls}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          )}
          <input
            type="email"
            required
            placeholder={t("email")}
            className={inputCls}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
          <input
            type="password"
            required
            placeholder={t("password")}
            className={inputCls}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? t("login_title") : t("register_title")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? t("no_account") : t("have_account")}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="font-semibold text-accent hover:underline"
          >
            {mode === "login" ? t("register_now") : t("login_now")}
          </button>
        </p>

        {mode === "login" && (
          <p className="mt-4 rounded-lg bg-secondary/60 p-3 text-center text-xs text-muted-foreground">
            Demo admin: admin@kahrabaplus.com / admin123
          </p>
        )}
      </div>
    </div>
  );
}
