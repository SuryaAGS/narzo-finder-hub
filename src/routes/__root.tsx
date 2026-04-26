import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { Toaster } from "sonner";
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
      { title: "VillageFinder — Discover Local Shops" },
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
      { property: "og:title", content: "VillageFinder — Discover Local Shops" },
      { property: "og:description", content: "VillageConnect is a rural discovery PWA for finding local shops and managing inventory." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "VillageFinder — Discover Local Shops" },
      { name: "description", content: "VillageConnect is a rural discovery PWA for finding local shops and managing inventory." },
      { name: "twitter:description", content: "VillageConnect is a rural discovery PWA for finding local shops and managing inventory." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3b09766b-5d74-4c77-b318-445797001a18/id-preview-8574dc6b--5096a0d4-127b-4277-a5d2-f9963a37c9da.lovable.app-1777182781803.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3b09766b-5d74-4c77-b318-445797001a18/id-preview-8574dc6b--5096a0d4-127b-4277-a5d2-f9963a37c9da.lovable.app-1777182781803.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
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
    <>
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
