import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileWarning, Calendar, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, addDays, isBefore } from "date-fns";
import CarLoader from "@/components/CarLoader";

const Alerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const alertsList: any[] = [];
    const today = new Date();
    const nextWeek = addDays(today, 7);

    // Get current user for explicit filtering
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [vehiclesRes, emis, docs, sales] = await Promise.all([
      supabase.from("vehicles").select("*").eq("status", "in_stock").eq("user_id", user.id),
      supabase.from("emi_schedules").select("*").eq("status", "pending").eq("user_id", user.id),
      supabase.from("documents").select("*").eq("user_id", user.id),
      supabase.from("sales").select("*").gt("balance_amount", 0).eq("user_id", user.id),
    ]);

    // 📞 Missed lead follow-ups
const { data: leads } = await supabase
  .from("leads")
  .select("*")
  .eq("user_id", user.id)
  .lt("follow_up_date", today.toISOString())
  .neq("status", "closed");

leads?.forEach((l) => {
  alertsList.push({
    type: "danger",
    icon: AlertTriangle,
    title: "Missed Follow-up",
    message: `Follow-up missed for lead ${l.customer_name}`,
  });
});

// 🧍 Inactive leads (no contact)
const inactiveLeads = leads?.filter(
  l =>
    !l.last_contact_date &&
    isBefore(new Date(l.created_at), addDays(today, -3))
);

inactiveLeads?.forEach((l) => {
  alertsList.push({
    type: "warning",
    icon: AlertTriangle,
    title: "Inactive Lead",
    message: `No contact made for ${l.customer_name}`,
  });
});


// ⚠️ EMI sale without EMI schedule
sales.data?.forEach((s) => {
  if (s.is_emi && !s.emi_configured) {
    alertsList.push({
      type: "danger",
      icon: CreditCard,
      title: "EMI Not Configured",
      message: `Sale ${s.sale_number} is EMI but schedule not configured`,
    });
  }
});

// 🚗 Vehicle expiry alerts
vehiclesRes.data?.forEach((v) => {
  const checks = [
    { date: v.insurance_expiry, label: "Insurance" },
    { date: v.puc_expiry, label: "PUC" },
    { date: v.fitness_expiry, label: "Fitness" },
    { date: v.road_tax_expiry, label: "Road Tax" },
  ];

  checks.forEach((c) => {
    if (!c.date) return;

    const expiry = new Date(c.date);

    if (isBefore(expiry, today)) {
      alertsList.push({
        type: "danger",
        icon: FileWarning,
        title: `${c.label} Expired`,
        message: `${v.brand} ${v.model} ${c.label} expired`,
      });
    } else if (isBefore(expiry, nextWeek)) {
      alertsList.push({
        type: "warning",
        icon: FileWarning,
        title: `${c.label} Expiring Soon`,
        message: `${v.brand} ${v.model} ${c.label} expires on ${format(expiry, "dd MMM")}`,
      });
    }
  });
});




    // Low stock alert
    if ((vehiclesRes.data?.length || 0) < 5) {
      alertsList.push({ type: "warning", icon: AlertTriangle, title: "Low Stock", message: `Only ${vehiclesRes.data?.length || 0} vehicles in stock` });
    }

    // 🚗 Idle inventory alert (30+ days unsold)
vehiclesRes.data?.forEach((v) => {
  const addedDate = new Date(v.created_at);
  if (isBefore(addedDate, addDays(today, -30))) {
    alertsList.push({
      type: "warning",
      icon: AlertTriangle,
      title: "Idle Inventory",
      message: `${v.brand} ${v.model} has been in stock for over 30 days`,
    });
  }
});

// ❌ EMI overdue alerts
emis.data?.forEach((e) => {
  if (isBefore(new Date(e.due_date), today)) {
    alertsList.push({
      type: "danger",
      icon: CreditCard,
      title: "EMI Overdue",
      message: `EMI #${e.emi_number} was due on ${format(new Date(e.due_date), "dd MMM")}`,
    });
  }
});


    // EMI due alerts
    emis.data?.forEach((e) => {
  const due = new Date(e.due_date);
  if (
    isBefore(due, nextWeek) &&
    !isBefore(due, today) // NOT overdue
  ) {
        alertsList.push({ type: "danger", icon: CreditCard, title: "EMI Due", message: `EMI #${e.emi_number} due on ${format(new Date(e.due_date), "dd MMM")}` });
      }
    });

    const recentSales = sales.data?.filter(s =>
  isBefore(addDays(today, -7), new Date(s.created_at))
);

if (!recentSales || recentSales.length === 0) {
  alertsList.push({
    type: "warning",
    icon: AlertTriangle,
    title: "No Recent Sales",
    message: "No sales recorded in the last 7 days",
  });
}

if ((emis.data?.length || 0) > 10) {
  alertsList.push({
    type: "warning",
    icon: CreditCard,
    title: "High EMI Exposure",
    message: `${emis.data?.length} active EMI schedules pending`,
  });
}


    // Document expiry alerts
    docs.data?.forEach((d) => {
      if (d.expiry_date) {
  const expiry = new Date(d.expiry_date);

  if (isBefore(expiry, today)) {
    alertsList.push({
      type: "danger",
      icon: FileWarning,
      title: "Document Expired",
      message: `${d.document_name} expired on ${format(expiry, "dd MMM")}`,
    });
  } else if (isBefore(expiry, nextWeek)) {
    alertsList.push({
      type: "warning",
      icon: FileWarning,
      title: "Document Expiring",
      message: `${d.document_name} expires on ${format(expiry, "dd MMM")}`,
    });
  }
}

    });

    // Pending payments
    sales.data?.forEach((s) => {
  if (s.balance_amount > 0) {
    alertsList.push({
      type: s.balance_amount > 50000 ? "danger" : "info",
      icon: Calendar,
      title: s.balance_amount > 50000 ? "High Pending Payment" : "Pending Payment",
      message: `₹${s.balance_amount.toLocaleString()} pending for ${s.sale_number}`,
    });
  }
});


// 📉 Expense spike alert
const { data: expenses } = await supabase
  .from("expenses")
  .select("amount, expense_date")
  .eq("user_id", user.id);

if (expenses) {
  const last7 = expenses.filter(e =>
    isBefore(addDays(today, -7), new Date(e.expense_date))
  );
  const prev7 = expenses.filter(e =>
    isBefore(addDays(today, -14), new Date(e.expense_date)) &&
    isBefore(new Date(e.expense_date), addDays(today, -7))
  );

  const sum = (arr: any[]) => arr.reduce((t, e) => t + e.amount, 0);

  if (sum(prev7) > 0 && sum(last7) > sum(prev7) * 1.4) {
    alertsList.push({
      type: "warning",
      icon: AlertTriangle,
      title: "Expense Spike",
      message: "Expenses increased sharply this week",
    });
  }
}



    setAlerts(alertsList);
    setLoading(false);
  };

  if (loading) {
  return <CarLoader />;
}

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
