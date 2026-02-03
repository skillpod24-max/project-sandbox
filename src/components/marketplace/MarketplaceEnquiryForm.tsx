import { useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle, Calendar, Clock, Car } from "lucide-react";
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

  // Generate time slots with more options
  const timeSlots = [
    { value: "09:00 AM", label: "9:00 AM - Morning" },
    { value: "10:00 AM", label: "10:00 AM - Morning" },
    { value: "11:00 AM", label: "11:00 AM - Late Morning" },
    { value: "12:00 PM", label: "12:00 PM - Noon" },
    { value: "02:00 PM", label: "2:00 PM - Afternoon" },
    { value: "03:00 PM", label: "3:00 PM - Afternoon" },
    { value: "04:00 PM", label: "4:00 PM - Late Afternoon" },
    { value: "05:00 PM", label: "5:00 PM - Evening" },
    { value: "06:00 PM", label: "6:00 PM - Evening" },
    { value: "07:00 PM", label: "7:00 PM - Late Evening" },
  ];

  // Get min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  
  // Get max date (30 days from now)
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 30);
  const maxDate = maxDateObj.toISOString().split('T')[0];

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
      
      {/* Test Drive Option - Enhanced UI */}
      {showTestDrive && (
        <div className="space-y-3 pt-2">
          <div 
            onClick={() => setWantTestDrive(!wantTestDrive)}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              wantTestDrive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
              wantTestDrive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${wantTestDrive ? 'text-blue-700' : 'text-slate-700'}`}>
                Free Test Drive
              </p>
              <p className="text-xs text-slate-500">Schedule a test drive at the dealership</p>
            </div>
            <Checkbox 
              id="testDrive" 
              checked={wantTestDrive}
              onCheckedChange={(checked) => setWantTestDrive(checked as boolean)}
              className="shrink-0"
            />
          </div>
          
          {wantTestDrive && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl space-y-3 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Select your preferred slot</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5 block font-medium">Date</Label>
                  <Input
                    type="date"
                    min={minDate}
                    max={maxDate}
                    value={testDriveDate}
                    onChange={(e) => setTestDriveDate(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5 block font-medium">Time</Label>
                  <select
                    value={testDriveTime}
                    onChange={(e) => setTestDriveTime(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose time</option>
                    {timeSlots.map((slot) => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                Dealer will confirm your slot within 2 hours
              </p>
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
