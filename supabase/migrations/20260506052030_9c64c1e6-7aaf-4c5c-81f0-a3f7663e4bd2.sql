ALTER TABLE public.shops REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;