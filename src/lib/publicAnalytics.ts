import { supabase } from "@/integrations/supabase/client";

/**
 * Generates or retrieves an anonymous session ID
 */
const getSessionId = (): string => {
  const key = "vh_public_session_id";
  let sessionId = localStorage.getItem(key);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }

  return sessionId;
};

export type PublicEventType =
  | "page_view"
  | "dealer_view"
  | "vehicle_view"
  | "enquiry_submit"
  | "cta_whatsapp"
  | "cta_call"
  | "scroll_25"
  | "scroll_50"
  | "scroll_75"
  | "scroll_100"
  | "engaged_30s"
  | "engaged_60s"
  | "engaged_120s"
  | "form_opened"
  | "form_abandoned";

interface TrackEventParams {
  eventType: PublicEventType;
  dealerUserId: string;
  publicPageId: string;
  vehicleId?: string;
}

// Debounce buffer to batch analytics inserts
let eventBuffer: Array<{
  event_type: string;
  dealer_user_id: string;
  public_page_id: string;
  vehicle_id: string | null;
  session_id: string;
}> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const flushEvents = async () => {
  if (eventBuffer.length === 0) return;
  const batch = [...eventBuffer];
  eventBuffer = [];
  
  try {
    const { error } = await supabase
      .from("public_page_events")
      .insert(batch as any);
    if (error) {
      console.error("❌ Analytics batch insert failed:", error);
    }
  } catch (e) {
    console.error("❌ Analytics exception:", e);
  }
};

export const trackPublicEvent = async ({
  eventType,
  dealerUserId,
  publicPageId,
  vehicleId,
}: TrackEventParams) => {
  eventBuffer.push({
    event_type: eventType,
    dealer_user_id: dealerUserId,
    public_page_id: publicPageId,
    vehicle_id: vehicleId ?? null,
    session_id: getSessionId(),
  });

  // Flush after 2 seconds of inactivity (batches rapid events)
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushEvents, 2000);

  // Flush immediately if buffer gets large
  if (eventBuffer.length >= 10) {
    if (flushTimer) clearTimeout(flushTimer);
    flushEvents();
  }
};
