import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

async function fetchCustomers(userId: string): Promise<Customer[]> {
  const { data } = await supabase
    .from("customers")
    .select("id, code, full_name, phone, email, address, notes, driving_license_number, id_proof_type, id_proof_number, is_active, converted_from_lead, lead_id, user_id, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data || []) as Customer[];
}

export function useCustomersData() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['customers', userId],
    queryFn: () => fetchCustomers(userId!),
    enabled: !!userId,
  });
}

export function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['customers'] });
}
