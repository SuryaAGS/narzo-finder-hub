-- 1. Profiles: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Move shops.whatsapp into a private, owner-only table
CREATE TABLE IF NOT EXISTS public.shop_contacts (
  shop_id uuid PRIMARY KEY REFERENCES public.shops(id) ON DELETE CASCADE,
  whatsapp text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_contacts ENABLE ROW LEVEL SECURITY;

-- Only the shop owner may read/write their contact row.
-- All other users must go through get_shop_whatsapp() (SECURITY DEFINER).
CREATE POLICY "Owner reads own shop contact"
ON public.shop_contacts
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.shops s
  WHERE s.id = shop_contacts.shop_id AND s.owner_id = auth.uid()
));

CREATE POLICY "Owner inserts own shop contact"
ON public.shop_contacts
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.shops s
  WHERE s.id = shop_contacts.shop_id AND s.owner_id = auth.uid()
));

CREATE POLICY "Owner updates own shop contact"
ON public.shop_contacts
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.shops s
  WHERE s.id = shop_contacts.shop_id AND s.owner_id = auth.uid()
));

CREATE POLICY "Owner deletes own shop contact"
ON public.shop_contacts
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.shops s
  WHERE s.id = shop_contacts.shop_id AND s.owner_id = auth.uid()
));

CREATE TRIGGER shop_contacts_touch_updated_at
BEFORE UPDATE ON public.shop_contacts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Backfill existing whatsapp values
INSERT INTO public.shop_contacts (shop_id, whatsapp)
SELECT id, whatsapp FROM public.shops
WHERE whatsapp IS NOT NULL AND whatsapp <> ''
ON CONFLICT (shop_id) DO NOTHING;

-- 4. Drop the whatsapp column from shops so it can never leak via RLS
ALTER TABLE public.shops DROP COLUMN IF EXISTS whatsapp;

-- 5. Update get_shop_whatsapp to read from the new table
CREATE OR REPLACE FUNCTION public.get_shop_whatsapp(_shop_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT whatsapp FROM public.shop_contacts WHERE shop_id = _shop_id;
$function$;

-- 6. Update become_shopkeeper to write the contact into the private table
CREATE OR REPLACE FUNCTION public.become_shopkeeper(
  _name text,
  _category text,
  _village text,
  _whatsapp text,
  _latitude double precision DEFAULT NULL::double precision,
  _longitude double precision DEFAULT NULL::double precision
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _shop_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF coalesce(btrim(_name), '') = '' OR coalesce(btrim(_village), '') = '' OR coalesce(btrim(_category), '') = '' THEN
    RAISE EXCEPTION 'Missing required shop fields';
  END IF;
  IF _whatsapp !~ '^[0-9]{10,15}$' THEN
    RAISE EXCEPTION 'Invalid WhatsApp number format';
  END IF;

  PERFORM set_config('app.allow_role_assign', 'shopkeeper', true);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'shopkeeper'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  PERFORM set_config('app.allow_role_assign', '', true);

  INSERT INTO public.shops (owner_id, name, category, village, latitude, longitude)
  VALUES (_uid, btrim(_name), _category, btrim(_village), _latitude, _longitude)
  RETURNING id INTO _shop_id;

  INSERT INTO public.shop_contacts (shop_id, whatsapp)
  VALUES (_shop_id, _whatsapp);

  RETURN _shop_id;
END;
$function$;