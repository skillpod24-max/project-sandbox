import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPublicLead } from "@/lib/leads";
import { trackPublicEvent } from "@/lib/publicAnalytics";

interface UnifiedEnquiryFormProps {
  dealerUserId: string;
  publicPageId: string;
  vehicleId?: string;
  vehicleInfo?: string;
  source: "public_dealer_page" | "public_vehicle_page" | "website" | "marketplace";
  showTestDrive?: boolean;
  compact?: boolean;
  onSuccess?: () => void;
}

const UnifiedEnquiryForm = memo(({
  dealerUserId,
  publicPageId,
  vehicleId,
  vehicleInfo,
  source,
  showTestDrive = false,
  compact = false,
  onSuccess,
}: UnifiedEnquiryFormProps) => {
  const { toast } = useToast();

  // Individual state for each field to prevent focus issues
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [wantTestDrive, setWantTestDrive] = useState(false);
  const [testDriveDate, setTestDriveDate] = useState("");
  const [testDriveTime, setTestDriveTime] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formOpened, setFormOpened] = useState(false);

  const handleFormFocus = useCallback(() => {
    if (!formOpened && dealerUserId) {
      setFormOpened(true);
      trackPublicEvent({
        eventType: "form_opened",
        dealerUserId,
        publicPageId,
        vehicleId,
      });
    }
  }, [formOpened, dealerUserId, publicPageId, vehicleId]);

  useEffect(() => {
    return () => {
      if (formOpened && !submitted && dealerUserId) {
        trackPublicEvent({
          eventType: "form_abandoned",
          dealerUserId,
          publicPageId,
          vehicleId,
        });
      }
    };
  }, [formOpened, submitted, dealerUserId, publicPageId, vehicleId]);

  const handleSubmit = async () => {
    if (!name || !phone) {
      toast({ title: "Name & phone required", variant: "destructive" });
      return;
    }

    if (wantTestDrive && (!testDriveDate || !testDriveTime)) {
      toast({ title: "Please select test drive date and time", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let notes = source === "marketplace" ? "[MARKETPLACE]" : "";
      if (message) notes += ` ${message}`;

      if (wantTestDrive) {
        notes += ` [TEST DRIVE REQUESTED: ${testDriveDate} at ${testDriveTime}]`;
      }

      await createPublicLead({
        dealerUserId,
        customerName: name,
        phone,
        email: email || undefined,
        vehicleInterest: vehicleInfo,
        notes: notes.trim() || undefined,
        source,
      });

      await trackPublicEvent({
        eventType: "enquiry_submit",
        dealerUserId,
        publicPageId,
        vehicleId,
      });

      setSubmitted(true);
      toast({ title: wantTestDrive ? "Test drive request sent!" : "Enquiry sent successfully!" });
      onSuccess?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="h-16 w-16 rounded-full bg-green-100/80 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-700 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {wantTestDrive ? "Test Drive Scheduled!" : "Enquiry Sent!"}
        </h3>
        <p className="text-muted-foreground mb-4">The dealer will contact you shortly.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSubmitted(false);
            setFormOpened(false);
            setName("");
            setPhone("");
            setEmail("");
            setMessage("");
            setWantTestDrive(false);
            setTestDriveDate("");
            setTestDriveTime("");
          }}
        >
          Send another enquiry
        </Button>
      </div>
    );
  }

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
  ];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Get the Best Price
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Share your details — we'll contact you shortly
        </p>
      </div>

      <Input
        placeholder="Your Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onFocus={handleFormFocus}
        className="border-border rounded-xl h-12"
      />
      <Input
        placeholder="Phone Number *"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onFocus={handleFormFocus}
        className="border-border rounded-xl h-12"
      />
      <Input
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onFocus={handleFormFocus}
        className="border-border rounded-xl h-12"
      />
      <Textarea
        placeholder="Message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onFocus={handleFormFocus}
        className="border-border rounded-xl"
        rows={3}
      />

      {/* Test Drive Option - Only for Marketplace */}
      {showTestDrive && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="testDrive"
              checked={wantTestDrive}
              onCheckedChange={(checked) => setWantTestDrive(checked as boolean)}
            />
            <Label htmlFor="testDrive" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              I want a free test drive
            </Label>
          </div>

          {wantTestDrive && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-xl">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Preferred Date</Label>
                <Input
                  type="date"
                  min={minDate}
                  value={testDriveDate}
                  onChange={(e) => setTestDriveDate(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Preferred Time</Label>
                <select
                  value={testDriveTime}
                  onChange={(e) => setTestDriveTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12 text-base font-semibold"
      >
        <Send className="h-4 w-4 mr-2" />
        {submitting ? "Sending..." : wantTestDrive ? "Request Test Drive" : "Get Best Price"}
      </Button>
    </div>
  );
});

UnifiedEnquiryForm.displayName = "UnifiedEnquiryForm";

export default UnifiedEnquiryForm;
