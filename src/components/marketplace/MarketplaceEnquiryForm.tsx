import { useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPublicLead } from "@/lib/leads";
import { trackPublicEvent } from "@/lib/publicAnalytics";

interface MarketplaceEnquiryFormProps {
  vehicle: {
    id: string;
    user_id: string;
    brand: string;
    model: string;
    manufacturing_year: number;
  };
  dealerPageId?: string;
  onSuccess?: () => void;
  showTestDrive?: boolean;
}

const MarketplaceEnquiryForm = memo(({ 
  vehicle, 
  dealerPageId = "marketplace",
  onSuccess,
  showTestDrive = true 
}: MarketplaceEnquiryFormProps) => {
  const { toast } = useToast();
  
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
    if (!formOpened && vehicle) {
      setFormOpened(true);
      trackPublicEvent({
        eventType: "form_opened",
        dealerUserId: vehicle.user_id,
        publicPageId: dealerPageId,
        vehicleId: vehicle.id
      });
    }
  }, [formOpened, vehicle, dealerPageId]);

  useEffect(() => {
    return () => {
      if (formOpened && !submitted && vehicle) {
        trackPublicEvent({
          eventType: "form_abandoned",
          dealerUserId: vehicle.user_id,
          publicPageId: dealerPageId,
          vehicleId: vehicle.id
        });
      }
    };
  }, [formOpened, submitted, vehicle, dealerPageId]);

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
      let notes = `[MARKETPLACE]`;
      if (message) notes += ` ${message}`;
      
      if (wantTestDrive) {
        notes += ` [TEST DRIVE REQUESTED: ${testDriveDate} at ${testDriveTime}]`;
      }

      await createPublicLead({
        dealerUserId: vehicle.user_id,
        customerName: name,
        phone: phone,
        email: email || undefined,
        vehicleInterest: `${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model}`,
        notes,
        source: "marketplace",
      });

      await trackPublicEvent({
        eventType: "enquiry_submit",
        dealerUserId: vehicle.user_id,
        publicPageId: dealerPageId,
        vehicleId: vehicle.id
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
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {wantTestDrive ? "Test Drive Scheduled!" : "Enquiry Sent!"}
        </h3>
        <p className="text-slate-500 mb-4">The dealer will contact you shortly.</p>
      </div>
    );
  }

  // Generate time slots
  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
  ];

  // Get min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      <Input
        placeholder="Your Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onFocus={handleFormFocus}
        className="border-slate-200 rounded-xl h-12"
      />
      <Input
        placeholder="Phone Number *"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onFocus={handleFormFocus}
        className="border-slate-200 rounded-xl h-12"
      />
      <Input
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onFocus={handleFormFocus}
        className="border-slate-200 rounded-xl h-12"
      />
      <Textarea
        placeholder="Message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onFocus={handleFormFocus}
        className="border-slate-200 rounded-xl"
        rows={3}
      />
      
      {/* Test Drive Option */}
      {showTestDrive && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="testDrive" 
              checked={wantTestDrive}
              onCheckedChange={(checked) => setWantTestDrive(checked as boolean)}
            />
            <Label htmlFor="testDrive" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              I want a free test drive
            </Label>
          </div>
          
          {wantTestDrive && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 rounded-xl">
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Preferred Date</Label>
                <Input
                  type="date"
                  min={minDate}
                  value={testDriveDate}
                  onChange={(e) => setTestDriveDate(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Preferred Time</Label>
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
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl h-12 text-base font-semibold"
      >
        <Send className="h-4 w-4 mr-2" />
        {submitting ? "Sending..." : wantTestDrive ? "Request Test Drive" : "Get Best Price"}
      </Button>
    </div>
  );
});

MarketplaceEnquiryForm.displayName = "MarketplaceEnquiryForm";

export default MarketplaceEnquiryForm;
