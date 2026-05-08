import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { CartProvider } from "@/hooks/useCart";
import { TopProgress } from "@/components/TopProgress";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That path doesn't exist in VillageFinder.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-warm"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "VillageFinder — Find local shops & stock" },
      {
        name: "description",
        content:
          "Find shops, prices and stock in your village. Order on WhatsApp. Built for rural India.",
      },
      { name: "theme-color", content: "#c8602b" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "VillageFinder" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "application-name", content: "VillageFinder" },
      { property: "og:site_name", content: "VillageFinder" },
      { property: "og:title", content: "VillageFinder — Find local shops & stock" },
      { property: "og:description", content: "Find shops, prices and stock in your village. Order on WhatsApp. Built for rural India." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://suryaags.github.io/VillageFinder/" },
      { property: "og:image", content: "https://suryaags.github.io/VillageFinder/social-preview.png" },
      { name: "twitter:title", content: "VillageFinder — Find local shops & stock" },
      { name: "twitter:description", content: "Find shops, prices and stock in your village. Order on WhatsApp. Built for rural India." },
      { name: "twitter:image", content: "https://suryaags.github.io/VillageFinder/social-preview.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://suryaags.github.io/VillageFinder/" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon-512.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Telugu:wght@400;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "VillageFinder",
          alternateName: "VillageFinder",
          url: "https://suryaags.github.io/VillageFinder/",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <CartProvider>
      <TopProgress />
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
    </CartProvider>
  );
}
