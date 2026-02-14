import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Clock, Car, CreditCard, UserPlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay } from "date-fns";

interface CalendarEvent {
  id: string;
  type: "follow_up" | "emi" | "test_drive";
  title: string;
  date: Date;
  subtitle?: string;
}

const TopBarCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) fetchEvents();
  }, [open]);

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = startOfDay(new Date());
    const weekEnd = endOfDay(addDays(today, 7));

    const [leadsRes, emisRes] = await Promise.all([
      supabase
        .from("leads")
        .select("id, customer_name, follow_up_date, notes, source")
        .eq("user_id", user.id)
        .gte("follow_up_date", today.toISOString())
        .lte("follow_up_date", weekEnd.toISOString())
        .order("follow_up_date", { ascending: true }),
      supabase
        .from("emi_schedules")
        .select("id, emi_number, due_date, emi_amount, sale_id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .gte("due_date", today.toISOString().split("T")[0])
        .lte("due_date", weekEnd.toISOString().split("T")[0])
        .order("due_date", { ascending: true })
        .limit(10),
    ]);

    const allEvents: CalendarEvent[] = [];

    // Follow-ups
    (leadsRes.data || []).forEach(lead => {
      const isTestDrive = lead.notes?.includes("TEST DRIVE REQUESTED");
      allEvents.push({
        id: lead.id,
        type: isTestDrive ? "test_drive" : "follow_up",
        title: isTestDrive ? `Test Drive - ${lead.customer_name}` : `Follow Up - ${lead.customer_name}`,
        date: new Date(lead.follow_up_date!),
        subtitle: lead.source === "marketplace" ? "Marketplace" : undefined,
      });
    });

    // EMI schedules
    (emisRes.data || []).forEach(emi => {
      allEvents.push({
        id: emi.id,
        type: "emi",
        title: `EMI #${emi.emi_number}`,
        date: new Date(emi.due_date),
        subtitle: `₹${emi.emi_amount.toLocaleString()}`,
      });
    });

    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    setEvents(allEvents);
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, dd MMM");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "follow_up": return <UserPlus className="h-3.5 w-3.5 text-blue-600" />;
      case "emi": return <CreditCard className="h-3.5 w-3.5 text-purple-600" />;
      case "test_drive": return <Car className="h-3.5 w-3.5 text-emerald-600" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "follow_up": return "bg-blue-100 text-blue-700";
      case "emi": return "bg-purple-100 text-purple-700";
      case "test_drive": return "bg-emerald-100 text-emerald-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const todayCount = events.filter(e => isToday(e.date)).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-1.5 md:p-2 rounded-lg hover:bg-muted transition-colors relative"
          title="Upcoming Schedule"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {todayCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {todayCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Upcoming Schedule</h3>
          <p className="text-xs text-muted-foreground">Next 7 days</p>
        </div>
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {events.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No upcoming events
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors hover:bg-muted/50 ${
                  isToday(event.date) ? "bg-primary/5 border border-primary/10" : ""
                }`}
              >
                <div className="mt-0.5">{getIcon(event.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{getDateLabel(event.date)}</span>
                    {event.subtitle && (
                      <Badge className={`${getTypeBadge(event.type)} text-[10px] px-1.5 py-0`}>
                        {event.subtitle}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TopBarCalendar;
