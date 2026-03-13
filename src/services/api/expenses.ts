import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];

async function fetchExpenses(userId: string): Promise<Expense[]> {
  const { data } = await supabase
    .from("expenses")
    .select("id, expense_number, description, category, amount, expense_date, payment_mode, vehicle_id, notes, user_id, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data || []) as Expense[];
}

export function useExpensesData() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => fetchExpenses(userId!),
    enabled: !!userId,
  });
}

export function useInvalidateExpenses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['expenses'] });
}
