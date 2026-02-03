-- Security linter: set immutable search_path on trigger functions

ALTER FUNCTION public.prevent_purchase_price_update() SET search_path = public;
ALTER FUNCTION public.prevent_sold_delete() SET search_path = public;
ALTER FUNCTION public.prevent_vendor_change() SET search_path = public;
