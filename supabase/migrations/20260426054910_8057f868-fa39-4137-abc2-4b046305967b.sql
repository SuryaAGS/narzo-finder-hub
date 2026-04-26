-- 1. Profiles: owner-only read access (was: any authenticated user)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Consolidate shops SELECT policies into one clean rule.
-- Previously we had two overlapping policies; the linter flagged the
-- "auth.uid() <> owner_id" trick as confusing. Collapse to a single
-- policy that lets any authenticated user read public shop fields
-- (name, category, village, lat/lng). Sensitive contact info lives in
-- shop_contacts (owner-only) and is only revealed via get_shop_whatsapp().
DROP POLICY IF EXISTS "Authenticated users read public shop fields" ON public.shops;
DROP POLICY IF EXISTS "Owners read full shop row" ON public.shops;

CREATE POLICY "Authenticated users can view shops"
ON public.shops
FOR SELECT
TO authenticated
USING (true);
