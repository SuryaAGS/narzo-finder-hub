import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppHeader } from "@/components/AppHeader";
import { t } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  head: () =>
    pageHead({
      title: "Reset password — VillageFinder",
      description: "Set a new password for your VillageFinder account.",
      path: "/reset-password",
    }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabase recovery sets a temporary session via the email link.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        toast.error("Reset link expired or invalid. Request a new one.");
        navigate({ to: "/forgot-password" });
      } else {
        setReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) throw error;
      toast.success(t("passwordUpdated"));
      navigate({ to: "/customer" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't update password";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader back="/login" />
      <main className="mx-auto max-w-2xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-warm shadow-warm">
            <KeyRound className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-black">{t("setNewPassword")}</h2>
          <p className="mt-1 text-muted-foreground">Choose a strong password (6+ characters).</p>

          {!ready ? (
            <div className="mt-8 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-3">
              <div className="rounded-3xl border-2 border-border bg-card p-2 focus-within:border-primary">
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder={t("newPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-lg outline-none placeholder:text-muted-foreground/70"
                />
              </div>
              <div className="rounded-3xl border-2 border-border bg-card p-2 focus-within:border-primary">
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder={t("confirmPassword")}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-lg outline-none placeholder:text-muted-foreground/70"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-warm px-6 py-4 text-lg font-bold text-primary-foreground shadow-warm transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                {t("submit")} →
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
