-- Allow anonymous (signed-out) users to browse shops, inventory and contacts
-- so the customer discovery view works even when an auth session has expired.

DROP POLICY IF EXISTS "Authenticated users can view shops" ON public.shops;
CREATE POLICY "Anyone can view shops"
  ON public.shops FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can view inventory" ON public.inventory;
CREATE POLICY "Anyone can view inventory"
  ON public.inventory FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can view shop contacts" ON public.shop_contacts;
-- Note: shop_contacts holds whatsapp numbers. Keep these readable so the
-- customer can tap "Order on WhatsApp"; the number is required by the UX.
CREATE POLICY "Anyone can view shop contacts"
  ON public.shop_contacts FOR SELECT
  TO anon, authenticated
  USING (true);
