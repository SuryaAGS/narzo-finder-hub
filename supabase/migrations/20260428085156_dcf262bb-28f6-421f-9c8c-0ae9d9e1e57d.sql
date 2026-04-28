-- 1. Defense-in-depth: RESTRICTIVE policy ensuring only 'customer' role can ever be self-inserted via API.
-- The existing trigger enforce_role_self_assignment already blocks this, but a RESTRICTIVE policy
-- provides a second, declarative layer that the security scanner can verify.
DROP POLICY IF EXISTS "Restrict role inserts to customer only" ON public.user_roles;
CREATE POLICY "Restrict role inserts to customer only"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (role = 'customer'::app_role AND auth.uid() = user_id);

-- 2. Allow authenticated users to read shop WhatsApp contacts directly (so customers can contact shops).
-- Owner-only INSERT/UPDATE/DELETE policies remain unchanged.
DROP POLICY IF EXISTS "Authenticated users can view shop contacts" ON public.shop_contacts;
CREATE POLICY "Authenticated users can view shop contacts"
ON public.shop_contacts
FOR SELECT
TO authenticated
USING (true);

-- 3. Re-assert search_path hardening on all SECURITY DEFINER functions (idempotent).
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.get_shop_whatsapp(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.enforce_role_self_assignment() SET search_path = public;
ALTER FUNCTION public.become_shopkeeper(text, text, text, text, double precision, double precision) SET search_path = public;