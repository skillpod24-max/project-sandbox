-- Security linter: tighten analytics INSERT policy (avoid WITH CHECK (true)).

DROP POLICY IF EXISTS "Allow public analytics insert" ON public.public_page_events;

CREATE POLICY "Allow public analytics insert"
ON public.public_page_events
FOR INSERT
TO public
WITH CHECK (
  event_type IS NOT NULL
  AND dealer_user_id IS NOT NULL
  AND public_page_id IS NOT NULL
  AND session_id IS NOT NULL
);
