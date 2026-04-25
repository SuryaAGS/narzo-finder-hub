import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/merchant")({
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
