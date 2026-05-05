import { motion, AnimatePresence } from "framer-motion";
import { X, Chrome, Compass } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Small modal with step-by-step instructions to re-enable browser geolocation. */
export function LocationHelpDialog({ open, onClose }: Props) {
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
            aria-labelledby="loc-help-title"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-card p-6 shadow-warm"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 id="loc-help-title" className="font-display text-xl font-bold">
              How to enable location?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You may have blocked GPS access earlier. Re-enable it from your browser
              settings, then refresh the page.
            </p>

            <section className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 font-bold">
                <Chrome className="h-4 w-4 text-primary" /> Chrome (Android &amp; Desktop)
              </div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Tap the lock / info icon in the address bar.</li>
                <li>Open <span className="font-semibold">Site settings</span>.</li>
                <li>
                  Set <span className="font-semibold">Location</span> to{" "}
                  <span className="font-semibold">Allow</span>.
                </li>
                <li>Reload this page.</li>
              </ol>
            </section>

            <section className="mt-3 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 font-bold">
                <Compass className="h-4 w-4 text-primary" /> Safari (iPhone &amp; Mac)
              </div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  iPhone: <span className="font-semibold">Settings → Safari → Location</span>{" "}
                  → <span className="font-semibold">Allow</span>.
                </li>
                <li>
                  Mac:{" "}
                  <span className="font-semibold">
                    Safari → Settings → Websites → Location
                  </span>{" "}
                  → set this site to <span className="font-semibold">Allow</span>.
                </li>
                <li>Also check iOS Settings → Privacy → Location Services is ON.</li>
                <li>Reload this page.</li>
              </ol>
            </section>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-2xl bg-gradient-warm px-5 py-3 text-sm font-bold text-primary-foreground shadow-warm active:scale-[0.98]"
            >
              Got it
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
