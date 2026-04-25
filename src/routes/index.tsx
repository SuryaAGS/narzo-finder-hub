import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Store, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-village.jpg";
import { LANG_KEY, t, getLang } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();

  // Auto-route signed-in users
  useEffect(() => {
    if (loading) return;
    if (!session) return;
    if (role === "customer") navigate({ to: "/customer" });
    else if (role === "shopkeeper") navigate({ to: "/merchant" });
    else navigate({ to: "/role" });
  }, [loading, session, role, navigate]);

  const lang = typeof window !== "undefined" ? getLang() : "en";
  const hasLang = typeof window !== "undefined" && !!localStorage.getItem(LANG_KEY);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Hero image with gradient overlay */}
      <div className="absolute inset-x-0 top-0 h-[55vh]">
        <img
          src={heroImg}
          alt="Village marketplace at golden hour"
          width={1280}
          height={896}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col px-6 pt-10">
        <div className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-warm shadow-warm">
            <span className="font-display text-xl font-black text-primary-foreground">V</span>
          </div>
          <span className="font-display text-xl font-bold">VillageFinder</span>
        </div>

        <div className="mt-auto pb-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-4xl border border-border/70 bg-card/90 p-6 backdrop-blur-md shadow-warm"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/40 px-3 py-1 text-xs font-bold text-accent-foreground">
              <Sparkles className="h-3 w-3" />
              For rural India · ఊరికోసం · गाँव के लिए
            </div>
            <h1 className="mt-3 font-display text-4xl font-black leading-[1.05] text-balance">
              {t("appName", lang)}
            </h1>
            <p className="mt-2 text-base text-muted-foreground text-balance">
              {t("tagline", lang)}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
                <Search className="h-4 w-4 text-primary" /> Smart search
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
                <Store className="h-4 w-4 text-secondary" /> Live stock
              </div>
            </div>

            <button
              onClick={() => navigate({ to: hasLang ? "/login" : "/language" })}
              className="mt-6 w-full rounded-2xl bg-gradient-warm px-6 py-4 text-lg font-bold text-primary-foreground shadow-warm transition-transform active:scale-[0.98]"
            >
              {t("continue", lang)} →
            </button>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
