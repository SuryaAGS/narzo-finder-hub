import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/merchant")({
  head: () =>
    pageHead({
      title: "Merchant — VillageFinder",
      description: "Redirecting to your shopkeeper dashboard.",
      path: "/merchant",
    }),
  component: MerchantRedirect,
});

// /merchant is an alias for /shopkeeper to match user expectations.
function MerchantRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/shopkeeper", replace: true });
  }, [navigate]);
  return null;
}
