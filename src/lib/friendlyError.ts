import { toast } from "sonner";

/**
 * Convert any Supabase / network error into a friendly, non-technical message.
 * Logs raw error to console for debugging, shows a toast to the user.
 */
export function friendlyError(err: unknown, fallback = "Oops, something went wrong. Please try again."): string {
  // Log raw details for developers — never shown to users.
  // eslint-disable-next-line no-console
  console.error("[friendlyError]", err);

  const code = (err as { code?: string } | null)?.code;
  const status = (err as { status?: number } | null)?.status;
  const message = (err as { message?: string } | null)?.message ?? "";

  // Common Postgres / PostgREST / Supabase-Auth codes
  if (code === "PGRST116" || /no rows/i.test(message)) {
    return "We couldn't find what you were looking for.";
  }
  if (code === "23505" || /duplicate key/i.test(message)) {
    return "That already exists. Try a different name.";
  }
  if (code === "42501" || status === 401 || status === 403 || /not authenticated|permission/i.test(message)) {
    return "You don't have access to do that. Try signing in again.";
  }
  if (status === 429 || /rate limit/i.test(message)) {
    return "Too many requests right now. Please wait a moment and try again.";
  }
  if (status === 0 || /network|fetch failed/i.test(message)) {
    return "Network problem. Check your connection and try again.";
  }
  return fallback;
}

/**
 * Show a friendly toast and return the message — useful in catch blocks.
 *   try { ... } catch (e) { showFriendlyError(e); }
 */
export function showFriendlyError(err: unknown, fallback?: string): string {
  const msg = friendlyError(err, fallback);
  toast.error(msg);
  return msg;
}
