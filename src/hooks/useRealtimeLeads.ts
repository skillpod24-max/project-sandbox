import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to realtime changes on the `leads` table for the given userId.
 * Calls `onUpdate` whenever an INSERT or UPDATE happens.
 */
export function useRealtimeLeads(userId: string | null, onUpdate: () => void) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`leads-realtime-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate]);
}
