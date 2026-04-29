import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { t } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, role, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Route to the right place.
  useEffect(() => {
    if (authLoading) return;
    if (!session) return;
    if (role === "customer") navigate({ to: "/customer" });
    else if (role === "shopkeeper") navigate({ to: "/merchant" });
    else navigate({ to: "/role" });
  }, [authLoading, session, role, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error: signErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (signErr) throw signErr;
        // Email confirmation may be off in Cloud — try signing in immediately.
        await supabase.auth.signInWithPassword({ email, password });
      } else {
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signErr) throw signErr;
      }
      // useAuth effect will redirect once session/role load.
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader back="/language" />
      <main className="mx-auto max-w-2xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-warm shadow-warm">
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-black text-balance">
            {t("emailTitle")}
          </h2>
          <p className="mt-1 text-muted-foreground">{t("emailHelp")}</p>

          <form onSubmit={submit} className="mt-8 space-y-3">
            <div className="rounded-3xl border-2 border-border bg-card p-2 focus-within:border-primary">
              <input
                type="email"
                autoComplete="email"
                required
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent px-4 py-3 text-lg outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            <div className="rounded-3xl border-2 border-border bg-card p-2 focus-within:border-primary">
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent px-4 py-3 text-lg outline-none placeholder:text-muted-foreground/70"
              />
            </div>

            {error && (
              <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-warm px-6 py-4 text-lg font-bold text-primary-foreground shadow-warm transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
              {mode === "signup" ? t("signUp") : t("signIn")} →
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError(null);
            }}
            className="mt-6 w-full text-center text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {mode === "signup" ? t("haveAccount") : t("needAccount")}
          </button>

          {mode === "signin" && (
            <Link
              to="/forgot-password"
              className="mt-3 block text-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          )}
        </motion.div>
      </main>
    </div>
  );
}
