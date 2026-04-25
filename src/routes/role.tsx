import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingBasket, Store } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ROLE_KEY, t } from "@/lib/i18n";

export const Route = createFileRoute("/role")({
  component: RolePage,
});

function RolePage() {
  const navigate = useNavigate();
  const choose = (role: "customer" | "shopkeeper") => {
    localStorage.setItem(ROLE_KEY, role);
    navigate({ to: role === "customer" ? "/customer" : "/shopkeeper" });
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-5 py-8">
        <h2 className="font-display text-3xl font-black text-balance">{t("chooseRole")}</h2>

        <div className="mt-8 grid gap-4">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => choose("customer")}
            className="group relative overflow-hidden rounded-4xl border border-border bg-card p-6 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-warm"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl transition-all group-hover:bg-primary/25" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-warm shadow-warm">
                <ShoppingBasket className="h-8 w-8 text-primary-foreground" />
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
            onClick={() => choose("shopkeeper")}
            className="group relative overflow-hidden rounded-4xl border border-border bg-card p-6 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-warm"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary/15 blur-2xl transition-all group-hover:bg-secondary/25" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-secondary shadow-soft">
                <Store className="h-8 w-8 text-secondary-foreground" />
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
