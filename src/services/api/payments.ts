import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type Payment = Database["public"]["Tables"]["payments"]["Row"];

async function fetchPayments(): Promise<Payment[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("payments")
    .select("id, payment_number, amount, payment_type, payment_mode, payment_date, effective_date, payment_purpose, description, reference_id, reference_type, customer_id, vendor_id, principal_amount, interest_amount, profit_amount, user_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data || []) as Payment[];
}

export function usePaymentsData() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
    staleTime: 2 * 60 * 1000,
  });
}

export function useInvalidatePayments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['payments'] });
}
