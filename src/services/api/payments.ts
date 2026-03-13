import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Payment = Database["public"]["Tables"]["payments"]["Row"];

async function fetchPayments(userId: string): Promise<Payment[]> {
  const { data } = await supabase
    .from("payments")
    .select("id, payment_number, amount, payment_type, payment_mode, payment_date, effective_date, payment_purpose, description, reference_id, reference_type, customer_id, vendor_id, principal_amount, interest_amount, profit_amount, user_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data || []) as Payment[];
}

export function usePaymentsData() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['payments', userId],
    queryFn: () => fetchPayments(userId!),
    enabled: !!userId,
  });
}

export function useInvalidatePayments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['payments'] });
}
