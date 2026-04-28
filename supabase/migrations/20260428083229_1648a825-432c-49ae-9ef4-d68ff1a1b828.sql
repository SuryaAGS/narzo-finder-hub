-- Harden user_roles against privilege escalation:
-- Add explicit RESTRICTIVE deny policies for UPDATE and DELETE so even if a
-- permissive policy is added later, role tampering remains blocked. The only
-- write path is the existing INSERT (customer self-assign) and SECURITY DEFINER
-- functions (become_shopkeeper, handle_new_user) which set app.allow_role_assign.

CREATE POLICY "Deny role updates"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny role deletes"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated, anon
  USING (false);

-- Attach the existing enforce_role_self_assignment trigger to user_roles INSERT
-- so even SECURITY DEFINER inserts must set app.allow_role_assign for non-customer
-- roles. This gives us defense-in-depth against any future permissive INSERT policy.
DROP TRIGGER IF EXISTS enforce_role_self_assignment_trg ON public.user_roles;
CREATE TRIGGER enforce_role_self_assignment_trg
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_role_self_assignment();

-- Lock down SECURITY DEFINER functions so they cannot be invoked directly by
-- anon/authenticated clients via PostgREST. They are only called from other
-- SECURITY DEFINER code paths or via explicit RPC where appropriate.
REVOKE EXECUTE ON FUNCTION public.enforce_role_self_assignment() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_shop_rating() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_app_feedback() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, public;

-- has_role, become_shopkeeper, get_shop_whatsapp are intentionally callable.
-- has_role: needed by RLS policy expressions evaluated as the calling role.
-- become_shopkeeper: the documented RPC entry point for shop creation.
-- get_shop_whatsapp: secure wrapper that exposes whatsapp only on explicit click.
-- These remain executable by authenticated users only (revoke from anon).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.become_shopkeeper(text, text, text, text, double precision, double precision) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.become_shopkeeper(text, text, text, text, double precision, double precision) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_shop_whatsapp(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_shop_whatsapp(uuid) TO authenticated;