import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBidNotifications = () => {
  const { toast } = useToast();

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }, []);

  const showNotification = useCallback((title: string, body: string, icon?: string) => {
    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: icon || "/favicon.ico",
        badge: "/favicon.ico",
        tag: "bid-notification",
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }

    // Also show toast notification
    toast({
      title,
      description: body,
    });
  }, [toast]);

  useEffect(() => {
    requestNotificationPermission();

    // Subscribe to auction updates
    const channel = supabase
      .channel('bid-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'auction_bids' },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const bid = payload.new as any;
          
          // Fetch auction details
          const { data: auction } = await supabase
            .from("auction_listings")
            .select("title, current_bidder_id, created_by")
            .eq("id", bid.auction_id)
            .single();

          if (!auction) return;

          // Notify if user was outbid
          if (auction.current_bidder_id === user.id && bid.bidder_id !== user.id) {
            showNotification(
              "🔔 You've been outbid!",
              `New bid of ₹${bid.bid_amount.toLocaleString('en-IN')} on "${auction.title}"`
            );
          }

          // Notify auction creator of new bids
          if (auction.created_by === user.id && bid.bidder_id !== user.id) {
            showNotification(
              "🎉 New Bid Received!",
              `₹${bid.bid_amount.toLocaleString('en-IN')} on "${auction.title}"`
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auction_listings' },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const auction = payload.new as any;
          const oldAuction = payload.old as any;

          // Notify on status changes
          if (auction.status !== oldAuction.status) {
            // Notify winner when auction ends
            if (auction.status === "auction_ended" && auction.current_bidder_id === user.id) {
              showNotification(
                "🏆 Congratulations! You Won!",
                `You won the auction "${auction.title}" with ₹${auction.current_bid?.toLocaleString('en-IN')}`
              );
            }

            // Notify on post-bid workflow updates
            if (auction.status.startsWith("post_bid_") && 
                (auction.current_bidder_id === user.id || auction.created_by === user.id)) {
              const statusMessages: Record<string, string> = {
                post_bid_seller_pending: "Waiting for seller confirmation",
                post_bid_dealer_pending: "Waiting for dealer confirmation", 
                post_bid_negotiation: "Negotiation in progress",
                payment_pending: "Payment is pending",
                sold: "Vehicle has been sold! 🎊",
              };
              
              showNotification(
                `📋 Auction Update: ${auction.title}`,
                statusMessages[auction.status] || `Status changed to ${auction.status}`
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestNotificationPermission, showNotification]);

  return {
    requestNotificationPermission,
    showNotification,
  };
};
