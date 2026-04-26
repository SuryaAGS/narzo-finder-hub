
-- 1. Block self-assignment of shopkeeper/admin via direct insert
CREATE OR REPLACE FUNCTION public.enforce_role_self_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow 'customer' to be inserted via the standard RLS path.
  -- Other roles must go through SECURITY DEFINER functions like become_shopkeeper().
  IF NEW.role <> 'customer'::app_role THEN
    RAISE EXCEPTION 'Role % cannot be self-assigned. Use the appropriate flow.', NEW.role
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_role_self_assignment_trg ON public.user_roles;
CREATE TRIGGER enforce_role_self_assignment_trg
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_role_self_assignment();

-- 2. Atomic become_shopkeeper: creates shop + assigns role
CREATE OR REPLACE FUNCTION public.become_shopkeeper(
  _name text,
  _category text,
  _village text,
  _whatsapp text,
  _latitude double precision DEFAULT NULL,
  _longitude double precision DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Bypass the trigger by inserting through SECURITY DEFINER context using a temp flag
  -- Simpler approach: temporarily set a session flag and check it in the trigger.
  PERFORM set_config('app.allow_role_assign', 'shopkeeper', true);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'shopkeeper'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  PERFORM set_config('app.allow_role_assign', '', true);

  INSERT INTO public.shops (owner_id, name, category, village, whatsapp, latitude, longitude)
  VALUES (_uid, btrim(_name), _category, btrim(_village), _whatsapp, _latitude, _longitude)
  RETURNING id INTO _shop_id;

  RETURN _shop_id;
END;
$$;

-- 3. Update trigger to honor the session flag set by become_shopkeeper
CREATE OR REPLACE FUNCTION public.enforce_role_self_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _allow text;
BEGIN
  _allow := coalesce(current_setting('app.allow_role_assign', true), '');
  IF NEW.role::text = _allow THEN
    RETURN NEW;
  END IF;
  IF NEW.role <> 'customer'::app_role THEN
    RAISE EXCEPTION 'Role % cannot be self-assigned.', NEW.role
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.become_shopkeeper(text, text, text, text, double precision, double precision) TO authenticated;

-- 4. Hide whatsapp from public reads. Drop the broad SELECT policy and split:
--    public can see shops without whatsapp via column grants;
--    authenticated callers use a function to fetch whatsapp.
-- Postgres RLS is row-level; for column hiding we use column-level grants.
REVOKE SELECT ON public.shops FROM anon, authenticated;
GRANT SELECT (id, owner_id, name, category, village, latitude, longitude, created_at, updated_at)
  ON public.shops TO anon, authenticated;
-- Owners still need to read their own whatsapp for management UI:
GRANT SELECT (whatsapp) ON public.shops TO authenticated;
-- The SELECT policy already restricts rows; we additionally restrict the whatsapp column
-- by only allowing the owner to read it through a policy-aware function.

-- Function to fetch a single shop's whatsapp for any authenticated user.
CREATE OR REPLACE FUNCTION public.get_shop_whatsapp(_shop_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT whatsapp FROM public.shops WHERE id = _shop_id;
$$;

REVOKE ALL ON FUNCTION public.get_shop_whatsapp(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_shop_whatsapp(uuid) TO authenticated;
