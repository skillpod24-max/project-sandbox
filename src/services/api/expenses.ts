import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];

async function fetchExpenses(): Promise<Expense[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("expenses")
    .select("id, expense_number, description, category, amount, expense_date, payment_mode, vehicle_id, notes, user_id, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data || []) as Expense[];
}

export function useExpensesData() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
    staleTime: 2 * 60 * 1000,
  });
}

export function useInvalidateExpenses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['expenses'] });
}
