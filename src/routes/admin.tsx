import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Users, Store, Star, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { showFriendlyError } from "@/lib/friendlyError";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

type Feedback = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [counts, setCounts] = useState<{ customers: number; shopkeepers: number } | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!isAdmin) {
      navigate({ to: "/" });
    }
  }, [authLoading, user, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    (async () => {
      try {
        const [{ data: roles, error: rolesErr }, { data: fb, error: fbErr }] = await Promise.all([
          supabase.from("user_roles").select("role"),
          supabase
            .from("app_feedback")
            .select("id, rating, comment, created_at")
            .order("created_at", { ascending: false })
            .limit(200),
        ]);
        if (rolesErr) throw rolesErr;
        if (fbErr) throw fbErr;
        if (!mounted) return;
        const customers = (roles ?? []).filter((r) => r.role === "customer").length;
        const shopkeepers = (roles ?? []).filter((r) => r.role === "shopkeeper").length;
        setCounts({ customers, shopkeepers });
        setFeedback((fb as Feedback[]) ?? []);
      } catch (e) {
        showFriendlyError(e, "Couldn't load admin data.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  if (authLoading || !user || !isAdmin) {
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
    <div className="min-h-screen pb-12">
      <AppHeader title={t("admin")} showLogout />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-earth p-6 text-primary-foreground shadow-warm"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm opacity-90">Founder</p>
              <p className="font-display text-2xl font-black truncate" title={user.email ?? undefined}>{user.email}</p>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatCard
            icon={<Users className="h-6 w-6" />}
            label={t("totalCustomers")}
            value={counts?.customers ?? 0}
            loading={loading}
          />
          <StatCard
            icon={<Store className="h-6 w-6" />}
            label={t("totalShopkeepers")}
            value={counts?.shopkeepers ?? 0}
            loading={loading}
          />
        </div>

        <h2 className="mt-8 flex items-center gap-2 font-display text-2xl font-bold">
          <Star className="h-5 w-5 text-warning" fill="currentColor" />
          {t("allFeedback")}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            ({feedback.length})
          </span>
        </h2>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
          </div>
        ) : feedback.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-muted-foreground">
            No feedback yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {feedback.map((f) => (
              <li
                key={f.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <StarRating value={f.rating} readOnly size={18} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(f.created_at).toLocaleString()}
                  </span>
                </div>
                {f.comment && (
                  <p className="mt-2 text-sm text-foreground">{f.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 font-display text-4xl font-black">
        {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : value}
      </p>
    </div>
  );
}
