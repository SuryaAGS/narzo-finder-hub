
-- Roles enum & user_roles table (separate from profiles to prevent privilege escalation)
CREATE TYPE public.app_role AS ENUM ('customer', 'shopkeeper');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own role" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  village TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
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
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Shops (one per shopkeeper for now)
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  village TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE INDEX shops_owner_idx ON public.shops(owner_id);
CREATE INDEX shops_village_idx ON public.shops(village);

CREATE POLICY "Anyone can view shops" ON public.shops FOR SELECT USING (true);
CREATE POLICY "Shopkeeper insert own shop" ON public.shops
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'shopkeeper'));
CREATE POLICY "Shopkeeper update own shop" ON public.shops
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Shopkeeper delete own shop" ON public.shops
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TRIGGER shops_touch BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Inventory
CREATE TYPE public.stock_status AS ENUM ('in', 'out');

CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pc',
  status stock_status NOT NULL DEFAULT 'in',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE INDEX inventory_shop_idx ON public.inventory(shop_id);
CREATE INDEX inventory_name_idx ON public.inventory(lower(name));

CREATE POLICY "Anyone can view inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Shopkeeper manages own inventory insert" ON public.inventory
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));
CREATE POLICY "Shopkeeper manages own inventory update" ON public.inventory
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));
CREATE POLICY "Shopkeeper manages own inventory delete" ON public.inventory
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));

CREATE TRIGGER inventory_touch BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
