import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBasket, Store, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { t } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/role")({
  component: RolePage,
});

function RolePage() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [saving, setSaving] = useState<"customer" | "shopkeeper" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // No session → send to login. Already has role → forward.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (role === "customer") navigate({ to: "/customer" });
    else if (role === "shopkeeper") navigate({ to: "/merchant" });
  }, [loading, user, role, navigate]);

  const choose = async (chosen: "customer" | "shopkeeper") => {
    if (!user) return;
    setSaving(chosen);
    setError(null);
    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: chosen });
    if (insErr && !insErr.message.includes("duplicate")) {
      setError(insErr.message);
      setSaving(null);
      return;
    }
    navigate({ to: chosen === "customer" ? "/customer" : "/merchant" });
  };

  return (
    <div className="min-h-screen">
      <AppHeader showLogout />
      <main className="mx-auto max-w-2xl px-5 py-8">
        <h2 className="font-display text-3xl font-black text-balance">{t("chooseRole")}</h2>

        {error && (
          <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-8 grid gap-4">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            disabled={saving !== null}
            onClick={() => choose("customer")}
            className="group relative overflow-hidden rounded-4xl border border-border bg-card p-6 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-warm disabled:opacity-60"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl transition-all group-hover:bg-primary/25" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-warm shadow-warm">
                {saving === "customer" ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
                ) : (
                  <ShoppingBasket className="h-8 w-8 text-primary-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold">{t("customer")}</h3>
                <p className="mt-1 text-muted-foreground">{t("customerDesc")}</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            disabled={saving !== null}
            onClick={() => choose("shopkeeper")}
            className="group relative overflow-hidden rounded-4xl border border-border bg-card p-6 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-warm disabled:opacity-60"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary/15 blur-2xl transition-all group-hover:bg-secondary/25" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-secondary shadow-soft">
                {saving === "shopkeeper" ? (
                  <Loader2 className="h-8 w-8 animate-spin text-secondary-foreground" />
                ) : (
                  <Store className="h-8 w-8 text-secondary-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold">{t("shopkeeper")}</h3>
                <p className="mt-1 text-muted-foreground">{t("shopkeeperDesc")}</p>
              </div>
            </div>
          </motion.button>
        </div>
      </main>
    </div>
  );
}
