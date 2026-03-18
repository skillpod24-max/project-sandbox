import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, FileWarning, Calendar, CreditCard } from "lucide-react";
import { format, addDays, isBefore } from "date-fns";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { formatIndianNumber } from "@/lib/formatters";

async function fetchAlertData(userId: string) {
  const today = new Date();

  const [vehiclesRes, emisRes, docsRes, salesRes, leadsRes, expensesRes] = await Promise.all([
    supabase.from("vehicles").select("id, brand, model, status, insurance_expiry, puc_expiry, fitness_expiry, road_tax_expiry, created_at").eq("status", "in_stock").eq("user_id", userId),
    supabase.from("emi_schedules").select("id, emi_number, due_date, status").eq("status", "pending").eq("user_id", userId),
    supabase.from("documents").select("id, document_name, expiry_date").eq("user_id", userId),
    supabase.from("sales").select("id, sale_number, balance_amount, is_emi, emi_configured, created_at").gt("balance_amount", 0).eq("user_id", userId),
    supabase.from("leads").select("id, customer_name, follow_up_date, last_contact_date, status, created_at").eq("user_id", userId).lt("follow_up_date", today.toISOString()).neq("status", "closed"),
    supabase.from("expenses").select("amount, expense_date").eq("user_id", userId),
  ]);

  return {
    vehicles: vehiclesRes.data || [],
    emis: emisRes.data || [],
    docs: docsRes.data || [],
    sales: salesRes.data || [],
    leads: leadsRes.data || [],
    expenses: expensesRes.data || [],
  };
}

const Alerts = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["alerts-data", userId],
    queryFn: () => fetchAlertData(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const alerts = useMemo(() => {
    if (!data) return [];
    const list: { type: string; icon: any; title: string; message: string }[] = [];
    const today = new Date();
    const nextWeek = addDays(today, 7);

    // Missed follow-ups
    data.leads.forEach((l) => {
      list.push({ type: "danger", icon: AlertTriangle, title: "Missed Follow-up", message: `Follow-up missed for lead ${l.customer_name}` });
    });

    // Inactive leads
    data.leads.filter(l => !l.last_contact_date && isBefore(new Date(l.created_at), addDays(today, -3))).forEach((l) => {
      list.push({ type: "warning", icon: AlertTriangle, title: "Inactive Lead", message: `No contact made for ${l.customer_name}` });
    });

    // EMI not configured
    data.sales.forEach((s) => {
      if (s.is_emi && !s.emi_configured) {
        list.push({ type: "danger", icon: CreditCard, title: "EMI Not Configured", message: `Sale ${s.sale_number} is EMI but schedule not configured` });
      }
    });

    // Vehicle expiry
    data.vehicles.forEach((v) => {
      [
        { date: v.insurance_expiry, label: "Insurance" },
        { date: v.puc_expiry, label: "PUC" },
        { date: v.fitness_expiry, label: "Fitness" },
        { date: v.road_tax_expiry, label: "Road Tax" },
      ].forEach((c) => {
        if (!c.date) return;
        const expiry = new Date(c.date);
        if (isBefore(expiry, today)) {
          list.push({ type: "danger", icon: FileWarning, title: `${c.label} Expired`, message: `${v.brand} ${v.model} ${c.label} expired` });
        } else if (isBefore(expiry, nextWeek)) {
          list.push({ type: "warning", icon: FileWarning, title: `${c.label} Expiring Soon`, message: `${v.brand} ${v.model} ${c.label} expires on ${format(expiry, "dd MMM")}` });
        }
      });
    });

    // Low stock
    if (data.vehicles.length < 5) {
      list.push({ type: "warning", icon: AlertTriangle, title: "Low Stock", message: `Only ${formatIndianNumber(data.vehicles.length)} vehicles in stock` });
    }

    // Idle inventory
    data.vehicles.forEach((v) => {
      if (isBefore(new Date(v.created_at), addDays(today, -30))) {
        list.push({ type: "warning", icon: AlertTriangle, title: "Idle Inventory", message: `${v.brand} ${v.model} has been in stock for over 30 days` });
      }
    });

    // EMI overdue
    data.emis.forEach((e) => {
      if (isBefore(new Date(e.due_date), today)) {
        list.push({ type: "danger", icon: CreditCard, title: "EMI Overdue", message: `EMI #${e.emi_number} was due on ${format(new Date(e.due_date), "dd MMM")}` });
      }
    });

    // EMI due soon
    data.emis.forEach((e) => {
      const due = new Date(e.due_date);
      if (isBefore(due, nextWeek) && !isBefore(due, today)) {
        list.push({ type: "danger", icon: CreditCard, title: "EMI Due", message: `EMI #${e.emi_number} due on ${format(due, "dd MMM")}` });
      }
    });

    // No recent sales
    const recentSales = data.sales.filter(s => isBefore(addDays(today, -7), new Date(s.created_at)));
    if (recentSales.length === 0) {
      list.push({ type: "warning", icon: AlertTriangle, title: "No Recent Sales", message: "No sales recorded in the last 7 days" });
    }

    // High EMI exposure
    if (data.emis.length > 10) {
      list.push({ type: "warning", icon: CreditCard, title: "High EMI Exposure", message: `${data.emis.length} active EMI schedules pending` });
    }

    // Document expiry
    data.docs.forEach((d) => {
      if (d.expiry_date) {
        const expiry = new Date(d.expiry_date);
        if (isBefore(expiry, today)) {
          list.push({ type: "danger", icon: FileWarning, title: "Document Expired", message: `${d.document_name} expired on ${format(expiry, "dd MMM")}` });
        } else if (isBefore(expiry, nextWeek)) {
          list.push({ type: "warning", icon: FileWarning, title: "Document Expiring", message: `${d.document_name} expires on ${format(expiry, "dd MMM")}` });
        }
      }
    });

    // Pending payments
    data.sales.forEach((s) => {
      if (s.balance_amount > 0) {
        list.push({ type: s.balance_amount > 50000 ? "danger" : "info", icon: Calendar, title: s.balance_amount > 50000 ? "High Pending Payment" : "Pending Payment", message: `₹${formatIndianNumber(s.balance_amount)} pending for ${s.sale_number}` });
      }
    });

    // Expense spike
    const sum = (arr: any[]) => arr.reduce((t: number, e: any) => t + e.amount, 0);
    const last7 = data.expenses.filter(e => isBefore(addDays(today, -7), new Date(e.expense_date)));
    const prev7 = data.expenses.filter(e => isBefore(addDays(today, -14), new Date(e.expense_date)) && isBefore(new Date(e.expense_date), addDays(today, -7)));
    if (sum(prev7) > 0 && sum(last7) > sum(prev7) * 1.4) {
      list.push({ type: "warning", icon: AlertTriangle, title: "Expense Spike", message: "Expenses increased sharply this week" });
    }

    return list;
  }, [data]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold">Alerts</h1><p className="text-muted-foreground">Important notifications</p></div>
      <div className="grid gap-4">
        {alerts.map((alert, i) => (
          <Card key={i} className={`border-l-4 ${alert.type === "danger" ? "border-l-destructive" : alert.type === "warning" ? "border-l-warning" : "border-l-info"}`}>
            <CardContent className="flex items-center gap-4 py-4">
              <alert.icon className={`h-6 w-6 ${alert.type === "danger" ? "text-destructive" : alert.type === "warning" ? "text-warning" : "text-info"}`} />
              <div><p className="font-medium">{alert.title}</p><p className="text-sm text-muted-foreground">{alert.message}</p></div>
            </CardContent>
          </Card>
        ))}
        {alerts.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No alerts at this time</CardContent></Card>}
      </div>
    </div>
  );
};

export default Alerts;