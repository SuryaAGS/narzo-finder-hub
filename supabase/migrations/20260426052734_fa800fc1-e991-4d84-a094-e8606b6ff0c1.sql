
-- 1. Restrict user_roles INSERT policy: customer role only.
-- The shopkeeper role is granted exclusively via the SECURITY DEFINER
-- function become_shopkeeper(), which bypasses RLS.
DROP POLICY IF EXISTS "Users insert own role" ON public.user_roles;

CREATE POLICY "Users self-assign customer role only"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'customer'::app_role
);

-- 2. Replace the broad shops SELECT policy with two scoped policies:
--    a) Owners can read their full row (including whatsapp).
--    b) Other authenticated users can read non-sensitive columns only,
--       enforced by the existing column-level GRANT (whatsapp is not
--       granted to authenticated). The get_shop_whatsapp() SECURITY DEFINER
--       function remains the contact-reveal path for customers.
DROP POLICY IF EXISTS "Authenticated users can view shops" ON public.shops;

CREATE POLICY "Owners read full shop row"
ON public.shops
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users read public shop fields"
ON public.shops
FOR SELECT
TO authenticated
USING (auth.uid() <> owner_id OR auth.uid() IS NULL);
-- Note: the column-level GRANT already prevents non-owners from selecting
-- the whatsapp column; this policy simply allows the row to be returned
-- with the granted columns.
