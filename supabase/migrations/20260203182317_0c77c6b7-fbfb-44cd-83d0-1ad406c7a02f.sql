-- Add more engagement event types for time tracking
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
        'engaged_60s',
        'engaged_120s',
        'form_opened',
        'form_abandoned'
      ]::text[]
    )
  );
