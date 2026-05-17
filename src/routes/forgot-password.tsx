import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppHeader } from "@/components/AppHeader";
import { t } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/forgot-password")({
  head: () =>
    pageHead({
      title: "Forgot password — VillageFinder",
      description: "Request a password reset link for your VillageFinder account.",
      path: "/forgot-password",
    }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email" }).max(255),
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success(t("resetEmailSent"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't send reset email";
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
          <h2 className="mt-6 font-display text-3xl font-black">{t("forgotPassword")}</h2>
          <p className="mt-1 text-muted-foreground">
            Enter your account email and we'll send you a reset link.
          </p>

          {sent ? (
            <div className="mt-8 rounded-3xl border-2 border-success/40 bg-success/10 p-5">
              <p className="font-semibold text-foreground">{t("resetEmailSent")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                It can take a minute to arrive. Check your spam folder.
              </p>
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> {t("backToSignIn")}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-3">
              <div className="rounded-3xl border-2 border-border bg-card p-2 focus-within:border-primary">
                <div className="flex items-center gap-2 px-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground/70"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-warm px-6 py-4 text-lg font-bold text-primary-foreground shadow-warm transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                {t("sendResetLink")} →
              </button>
              <Link
                to="/login"
                className="mt-2 block text-center text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline"
              >
                {t("backToSignIn")}
              </Link>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
