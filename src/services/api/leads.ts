import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export interface Lead {
  id: string;
  user_id: string;
  lead_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  vehicle_interest: string | null;
  budget_min: number | null;
  budget_max: number | null;
  source: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  follow_up_date: string | null;
  last_contact_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  city?: string | null;
  lead_type?: string | null;
  last_viewed_at?: string | null;
  converted_from_lead?: boolean | null;
}

async function fetchLeads(userId: string): Promise<Lead[]> {
  const { data } = await supabase
    .from("leads")
    .select("id, user_id, lead_number, customer_name, phone, email, vehicle_interest, budget_min, budget_max, source, status, priority, assigned_to, follow_up_date, last_contact_date, notes, created_at, updated_at, city, lead_type, last_viewed_at, converted_from_lead")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data || []) as Lead[];
}

export function useLeadsData() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['leads', userId],
    queryFn: () => fetchLeads(userId!),
    enabled: !!userId,
  });
}

export function useInvalidateLeads() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['leads'] });
}
