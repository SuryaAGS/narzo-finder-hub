import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Slim top progress bar that animates while TanStack Router is loading
 * (link clicks, route transitions, loaders). Hidden when idle.
 */
export function TopProgress() {
  const status = useRouterState({ select: (s) => s.status });
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (status === "pending") {
      setVisible(true);
      setProgress(8);
      // Trickle towards 90%
      const tick = () => {
        setProgress((p) => (p < 90 ? p + (90 - p) * 0.08 : p));
        raf = window.setTimeout(tick, 180) as unknown as number;
      };
      tick();
    } else {
      setProgress(100);
      timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }
    return () => {
      if (raf) clearTimeout(raf);
      if (timer) clearTimeout(timer);
    };
  }, [status]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms" }}
    >
      <div
        className="h-full bg-gradient-warm shadow-[0_0_8px_rgba(200,96,43,0.6)]"
        style={{
          width: `${progress}%`,
          transition: "width 180ms ease-out",
        }}
      />
    </div>
  );
}
