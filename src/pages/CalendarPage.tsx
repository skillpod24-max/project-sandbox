import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Clock, Car, CreditCard, UserPlus, Phone } from "lucide-react";
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/page-skeleton";

interface CalendarEvent {
  id: string;
  type: "follow_up" | "emi" | "test_drive";
  title: string;
  date: Date;
  subtitle?: string;
  phone?: string;
  notes?: string;
}

const CalendarPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const today = startOfDay(new Date());
    const monthEnd = endOfDay(addDays(today, 30));

    const [leadsRes, emisRes] = await Promise.all([
      supabase
        .from("leads")
        .select("id, customer_name, follow_up_date, notes, source, phone")
        .eq("user_id", user.id)
        .gte("follow_up_date", today.toISOString())
        .lte("follow_up_date", monthEnd.toISOString())
        .order("follow_up_date", { ascending: true }),
      supabase
        .from("emi_schedules")
        .select("id, emi_number, due_date, emi_amount, sale_id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .gte("due_date", today.toISOString().split("T")[0])
        .lte("due_date", monthEnd.toISOString().split("T")[0])
        .order("due_date", { ascending: true }),
    ]);

    const allEvents: CalendarEvent[] = [];

    (leadsRes.data || []).forEach(lead => {
      const isTestDrive = lead.notes?.includes("TEST DRIVE REQUESTED");
      allEvents.push({
        id: lead.id,
        type: isTestDrive ? "test_drive" : "follow_up",
        title: isTestDrive ? `Test Drive - ${lead.customer_name}` : `Follow Up - ${lead.customer_name}`,
        date: new Date(lead.follow_up_date!),
        subtitle: lead.source === "marketplace" ? "Marketplace" : undefined,
        phone: lead.phone,
      });
    });

    (emisRes.data || []).forEach(emi => {
      allEvents.push({
        id: emi.id,
        type: "emi",
        title: `EMI #${emi.emi_number}`,
        date: new Date(emi.due_date),
        subtitle: `₹${emi.emi_amount.toLocaleString("en-IN")}`,
      });
    });

    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    setEvents(allEvents);
    setLoading(false);
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, dd MMM");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "follow_up": return <UserPlus className="h-4 w-4 text-blue-600" />;
      case "emi": return <CreditCard className="h-4 w-4 text-purple-600" />;
      case "test_drive": return <Car className="h-4 w-4 text-emerald-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const typeConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    follow_up: { label: "Follow Up", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
    emi: { label: "EMI Due", bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
    test_drive: { label: "Test Drive", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  };

  // Generate 30 days for the mini-calendar
  const days = Array.from({ length: 30 }, (_, i) => addDays(startOfDay(new Date()), i));
  const eventsForDate = (date: Date) => events.filter(e => isSameDay(e.date, date));
  const selectedEvents = eventsForDate(selectedDate);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Schedule & Calendar
          </h1>
          <p className="text-muted-foreground">Next 30 days overview</p>
        </div>
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${cfg.dot}`} />
            <span className="text-sm text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Day Strip */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((day) => {
          const dayEvents = eventsForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center min-w-[56px] px-3 py-2 rounded-xl border transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : isToday(day)
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              <span className="text-[10px] font-medium uppercase">{format(day, "EEE")}</span>
              <span className="text-lg font-bold">{format(day, "dd")}</span>
              <span className="text-[10px]">{format(day, "MMM")}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <span key={i} className={`h-1.5 w-1.5 rounded-full ${typeConfig[e.type]?.dot || "bg-muted-foreground"}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Events for selected date */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg">
            {isToday(selectedDate) ? "Today" : isTomorrow(selectedDate) ? "Tomorrow" : format(selectedDate, "EEEE, dd MMMM yyyy")}
            <Badge variant="outline" className="ml-2">{selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No events scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => {
                const cfg = typeConfig[event.type];
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className={`h-10 w-10 rounded-lg ${cfg?.bg} flex items-center justify-center shrink-0`}>
                      {getIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{event.title}</p>
                        <Badge className={`${cfg?.bg} ${cfg?.text} text-xs border-0`}>{cfg?.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(event.date, "hh:mm a")} · {getDateLabel(event.date)}
                      </p>
                      {event.subtitle && (
                        <Badge variant="outline" className="mt-1 text-xs">{event.subtitle}</Badge>
                      )}
                      {event.phone && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {event.phone}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All upcoming events */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg">All Upcoming Events ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events.map((event) => {
              const cfg = typeConfig[event.type];
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                    isSameDay(event.date, selectedDate) ? "bg-primary/5 border border-primary/10" : ""
                  }`}
                  onClick={() => setSelectedDate(startOfDay(event.date))}
                >
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${cfg?.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{getDateLabel(event.date)}</span>
                  {event.subtitle && (
                    <Badge className={`${cfg?.bg} ${cfg?.text} text-[10px] border-0`}>{event.subtitle}</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;
