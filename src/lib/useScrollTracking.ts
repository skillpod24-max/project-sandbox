import { useEffect, useRef } from "react";
import { trackPublicEvent } from "@/lib/publicAnalytics";

interface ScrollTrackingProps {
  dealerUserId: string;
  publicPageId: string;
  vehicleId?: string;
}

export const useScrollTracking = ({
  dealerUserId,
  publicPageId,
  vehicleId,
}: ScrollTrackingProps) => {
  const fired = useRef({
    s25: false,
    s50: false,
    s75: false,
    s100: false,
    engaged: false,
  });

  

  useEffect(() => {
  if (!dealerUserId || !publicPageId) return;

    const start = Date.now();

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      if (percent >= 25 && !fired.current.s25) {
        fired.current.s25 = true;
        trackPublicEvent({ eventType: "scroll_25", dealerUserId, publicPageId, vehicleId });
      }

      if (percent >= 50 && !fired.current.s50) {
        fired.current.s50 = true;
        trackPublicEvent({ eventType: "scroll_50", dealerUserId, publicPageId, vehicleId });
      }

      if (percent >= 75 && !fired.current.s75) {
        fired.current.s75 = true;
        trackPublicEvent({ eventType: "scroll_75", dealerUserId, publicPageId, vehicleId });
      }

      if (percent >= 95 && !fired.current.s100) {
        fired.current.s100 = true;
        trackPublicEvent({ eventType: "scroll_100", dealerUserId, publicPageId, vehicleId });
      }
    };

    const timer = setTimeout(() => {
      if (!fired.current.engaged) {
        fired.current.engaged = true;
        trackPublicEvent({
          eventType: "engaged_30s",
          dealerUserId,
          publicPageId,
          vehicleId,
        });
      }
    }, 30000);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [dealerUserId, publicPageId, vehicleId]);
};
