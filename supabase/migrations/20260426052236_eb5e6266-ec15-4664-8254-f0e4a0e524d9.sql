
-- 1. Tighten shops SELECT: require authentication
DROP POLICY IF EXISTS "Anyone can view shops" ON public.shops;

CREATE POLICY "Authenticated users can view shops"
ON public.shops
FOR SELECT
TO authenticated
USING (true);

-- Same for inventory: only authenticated browsers can read
DROP POLICY IF EXISTS "Anyone can view inventory" ON public.inventory;

CREATE POLICY "Authenticated users can view inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (true);

-- 2. Stop leaking email prefix as display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Shopper'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );
  RETURN NEW;
END;
$function$;

-- 3. Scrub any existing display_names that were set from email prefixes.
-- We can't perfectly detect old leaks, but we can blank out anything matching
-- the `<localpart>@<domain>` of the corresponding auth.users.email row.
UPDATE public.profiles p
SET display_name = 'Shopper'
FROM auth.users u
WHERE p.id = u.id
  AND p.display_name = split_part(u.email, '@', 1);
