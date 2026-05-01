import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, X, Navigation } from "lucide-react";
import { t } from "@/lib/i18n";

type Props = {
  open: boolean;
  loading: boolean;
  error: string | null;
  onAllow: () => void;
  onClose: () => void;
};

/** Mobile-friendly bottom sheet that asks the user to share their location. */
export function LocationSheet({ open, loading, error, onAllow, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="loc-sheet-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-warm"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-warm shadow-warm">
              <Navigation className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 id="loc-sheet-title" className="mt-4 font-display text-2xl font-bold">
              {t("confirmLocation")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("locSheetBody")}</p>

            {/* Permission banner */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 dark:bg-blue-500/15">
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-blue-900 dark:text-blue-100">
                    {t("locOff")}
                  </p>
                  <p className="truncate text-xs text-blue-800/80 dark:text-blue-200/80">
                    {t("locOffHelp")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onAllow}
                disabled={loading}
                className="shrink-0 rounded-full bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-soft transition-transform active:scale-95 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("grant")}
              </button>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {t("locDenied")}
              </p>
            )}

            <button
              type="button"
              onClick={onAllow}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-warm px-5 py-4 text-base font-bold text-primary-foreground shadow-warm transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
              {t("locSheetAllow")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-2xl px-5 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              {t("locSheetSkip")}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
