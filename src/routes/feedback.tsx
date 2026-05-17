import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Star } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { showFriendlyError } from "@/lib/friendlyError";
import { t } from "@/lib/i18n";
import { toast } from "sonner";

import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/feedback")({
  head: () =>
    pageHead({
      title: "Send feedback — VillageFinder",
      description: "Share suggestions and report issues to the VillageFinder team.",
      path: "/feedback",
    }),
  component: FeedbackPage,
});

function FeedbackPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating < 1) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("app_feedback").insert({
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
      setDone(true);
      toast.success(t("thanksFeedback"));
    } catch (e) {
      showFriendlyError(e, "Couldn't send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="flex items-center justify-center pt-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader title={t("feedback")} showLogout />
      <main className="mx-auto max-w-xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-warm shadow-warm">
            <Star className="h-8 w-8 text-primary-foreground" fill="currentColor" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-black text-balance">{t("rateApp")}</h2>
          <p className="mt-1 text-muted-foreground">
            How is VillageFinder working for you?
          </p>

          {done ? (
            <div className="mt-8 rounded-3xl border-2 border-success/30 bg-success/10 p-6">
              <p className="font-display text-xl font-bold text-success-foreground">
                {t("thanksFeedback")}
              </p>
              <button
                onClick={() => {
                  setDone(false);
                  setRating(0);
                  setComment("");
                }}
                className="mt-4 text-sm font-semibold text-primary underline-offset-2 hover:underline"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("yourRating")}
                </label>
                <div className="mt-2">
                  <StarRating value={rating} onChange={setRating} size={36} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("optionalComment")}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="mt-1 w-full rounded-3xl border-2 border-border bg-card p-4 outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || rating < 1}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-warm px-6 py-4 text-lg font-bold text-primary-foreground shadow-warm transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                {t("submit")}
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
