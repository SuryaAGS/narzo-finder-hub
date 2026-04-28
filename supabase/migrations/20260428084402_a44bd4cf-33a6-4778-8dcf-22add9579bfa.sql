ALTER TABLE public.app_feedback
  ADD CONSTRAINT feedback_rating_range CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE public.shop_ratings
  ADD CONSTRAINT shop_rating_range CHECK (rating BETWEEN 1 AND 5);