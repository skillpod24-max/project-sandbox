import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReportsData {
  sales: any[];
  vehicles: any[];
  purchases: any[];
  payments: any[];
  emis: any[];
  customers: any[];
  expenses: any[];
  vendors: any[];
  leads: any[];
  events: any[];
}

export const useReportsData = () => {
  const [data, setData] = useState<ReportsData>({
    sales: [], vehicles: [], purchases: [], payments: [],
    emis: [], customers: [], expenses: [], vendors: [],
    leads: [], events: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [s, v, p, pay, e, c, ex, vn, l, ev] = await Promise.all([
        supabase.from("sales").select("*").eq("user_id", user.id),
        supabase.from("vehicles").select("*").eq("user_id", user.id),
        supabase.from("vehicle_purchases").select("*").eq("user_id", user.id),
        supabase.from("payments").select("*").eq("user_id", user.id),
        supabase.from("emi_schedules").select("*").eq("user_id", user.id),
        supabase.from("customers").select("*").eq("user_id", user.id),
        supabase.from("expenses").select("*").eq("user_id", user.id),
        supabase.from("vendors").select("*").eq("user_id", user.id),
        supabase.from("leads").select("*").eq("user_id", user.id),
        supabase.from("public_page_events").select("*").eq("dealer_user_id", user.id),
      ]);

      setData({
        sales: s.data || [], vehicles: v.data || [],
        purchases: p.data || [], payments: pay.data || [],
        emis: e.data || [], customers: c.data || [],
        expenses: ex.data || [], vendors: vn.data || [],
        leads: l.data || [], events: ev.data || [],
      });
      setLoading(false);
    };
    fetchAll();
  }, []);

  return { data, loading };
};
