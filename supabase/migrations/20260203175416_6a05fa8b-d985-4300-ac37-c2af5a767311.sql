-- Fix marketplace dealer-page enquiries failing for logged-in users (authenticated role)
-- and fix analytics event_type constraint rejecting dealer_view/form_opened/form_abandoned.

/* 1) Allow marketplace lead inserts for authenticated users too */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'leads'
      AND policyname = 'Allow authenticated marketplace enquiries'
  ) THEN
    CREATE POLICY "Allow authenticated marketplace enquiries"
    ON public.leads
    FOR INSERT
    TO authenticated
    WITH CHECK (
      (source = 'marketplace'::text) AND (user_id IS NOT NULL)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'leads'
      AND policyname = 'Allow authenticated sell vehicle submissions'
  ) THEN
    CREATE POLICY "Allow authenticated sell vehicle submissions"
    ON public.leads
    FOR INSERT
    TO authenticated
    WITH CHECK (
      (source = 'marketplace_sell'::text) AND (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    );
  END IF;
END $$;

/* 2) Expand allowed analytics event types */
ALTER TABLE public.public_page_events
  DROP CONSTRAINT IF EXISTS public_page_events_event_type_check;

ALTER TABLE public.public_page_events
  ADD CONSTRAINT public_page_events_event_type_check
  CHECK (
    event_type = ANY (
      ARRAY[
        'page_view',
        'dealer_view',
        'vehicle_view',
        'enquiry_submit',
        'cta_whatsapp',
        'cta_call',
        'scroll_25',
        'scroll_50',
        'scroll_75',
        'scroll_100',
        'engaged_30s',
        'form_opened',
        'form_abandoned'
      ]::text[]
    )
  );
