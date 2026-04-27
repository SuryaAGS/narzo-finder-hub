
-- 2. Add 'landmark' column to shops
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS landmark text;

-- 3. shop_ratings table
CREATE TABLE IF NOT EXISTS public.shop_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating smallint NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, user_id)
);

CREATE OR REPLACE FUNCTION public.validate_shop_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_shop_rating ON public.shop_ratings;
CREATE TRIGGER trg_validate_shop_rating
BEFORE INSERT OR UPDATE ON public.shop_ratings
FOR EACH ROW EXECUTE FUNCTION public.validate_shop_rating();

DROP TRIGGER IF EXISTS trg_shop_ratings_touch ON public.shop_ratings;
CREATE TRIGGER trg_shop_ratings_touch
BEFORE UPDATE ON public.shop_ratings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.shop_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read shop ratings" ON public.shop_ratings;
CREATE POLICY "Anyone authenticated can read shop ratings"
  ON public.shop_ratings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Customers insert own shop rating" ON public.shop_ratings;
CREATE POLICY "Customers insert own shop rating"
  ON public.shop_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers update own shop rating" ON public.shop_ratings;
CREATE POLICY "Customers update own shop rating"
  ON public.shop_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers delete own shop rating" ON public.shop_ratings;
CREATE POLICY "Customers delete own shop rating"
  ON public.shop_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. app_feedback table
CREATE TABLE IF NOT EXISTS public.app_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rating smallint NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_app_feedback()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_app_feedback ON public.app_feedback;
CREATE TRIGGER trg_validate_app_feedback
BEFORE INSERT OR UPDATE ON public.app_feedback
FOR EACH ROW EXECUTE FUNCTION public.validate_app_feedback();

ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own feedback" ON public.app_feedback;
CREATE POLICY "Users insert own feedback"
  ON public.app_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own feedback" ON public.app_feedback;
CREATE POLICY "Users read own feedback"
  ON public.app_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all feedback" ON public.app_feedback;
CREATE POLICY "Admins read all feedback"
  ON public.app_feedback FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Allow admins to read user_roles aggregate info (for dashboard counts)
DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
CREATE POLICY "Admins read all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. Update handle_new_user to seed admin for the founder email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Shopper'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );

  -- Auto-grant admin to the founder email
  IF lower(NEW.email) = 'perabathulasurya58@gmail.com' THEN
    PERFORM set_config('app.allow_role_assign', 'admin', true);
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    PERFORM set_config('app.allow_role_assign', '', true);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Backfill admin role for the founder email if the account already exists
DO $$
DECLARE
  _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = 'perabathulasurya58@gmail.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    PERFORM set_config('app.allow_role_assign', 'admin', true);
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    PERFORM set_config('app.allow_role_assign', '', true);
  END IF;
END $$;
