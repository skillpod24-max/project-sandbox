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
  | "vehicle_view"
  | "enquiry_submit"
  | "cta_whatsapp"
  | "cta_call"
  | "scroll_25"
  | "scroll_50"
  | "scroll_75"
  | "scroll_100"
  | "engaged_30s"
  | "form_opened"
  | "form_abandoned";

interface TrackEventParams {
  eventType: PublicEventType;
  dealerUserId: string;
  publicPageId: string;
  vehicleId?: string;
}

export const trackPublicEvent = async ({
  eventType,
  dealerUserId,
  publicPageId,
  vehicleId,
}: TrackEventParams) => {
  const payload = {
    event_type: eventType,
    dealer_user_id: dealerUserId,
    public_page_id: publicPageId,
    vehicle_id: vehicleId ?? null,
    session_id: getSessionId(),
  };

  console.log("📡 Tracking event:", payload);

  try {
    const { error } = await supabase
      .from("public_page_events")
      .insert(payload as any);

    if (error) {
      console.error("❌ Analytics insert failed:", error);
    } else {
      console.log("✅ Analytics saved:", eventType);
    }
  } catch (e) {
    console.error("❌ Analytics exception:", e);
  }
};
