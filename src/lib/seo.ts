// Per-route SEO helpers. Keep titles under 60 chars and descriptions under 160.
export const SITE_URL = "https://suryaags.github.io/VillageFinder";
export const SITE_NAME = "VillageFinder";

export function pageHead(opts: {
  title: string;
  description: string;
  path: string; // e.g. "/customer"
}) {
  const url = `${SITE_URL}${opts.path === "/" ? "/" : opts.path}`;
  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.description },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.description },
      { property: "og:url", content: url },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
