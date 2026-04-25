import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { LANGS, type Lang, getLang, setLang, t } from "@/lib/i18n";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/language")({
  component: LanguagePage,
});

function LanguagePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Lang>("en");

  useEffect(() => {
    setSelected(getLang());
  }, []);

  const onContinue = () => {
    setLang(selected);
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen">
      <AppHeader title={t("chooseLang", selected)} />
      <main className="mx-auto max-w-2xl px-5 py-8">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-black text-balance"
        >
          {t("chooseLang", selected)}
        </motion.h2>
        <p className="mt-1 text-muted-foreground">తెలుగు · हिन्दी · English</p>

        <div className="mt-8 space-y-3">
          {LANGS.map((l, i) => {
            const active = selected === l.code;
            return (
              <motion.button
                key={l.code}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(l.code)}
                className={`flex w-full items-center justify-between rounded-3xl border-2 px-6 py-5 text-left transition-all ${
                  active
                    ? "border-primary bg-gradient-warm text-primary-foreground shadow-warm"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div>
                  <div className="font-display text-2xl font-bold">{l.native}</div>
                  <div className={`text-sm ${active ? "opacity-90" : "text-muted-foreground"}`}>
                    {l.english}
                  </div>
                </div>
                {active && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={onContinue}
          className="mt-10 w-full rounded-2xl bg-foreground px-6 py-4 text-lg font-bold text-background shadow-soft active:scale-[0.98]"
        >
          {t("continue", selected)} →
        </button>
      </main>
    </div>
  );
}
