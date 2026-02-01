import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, CheckCircle, Car, ArrowLeft, User, MapPin, Camera } from "lucide-react";
import { getBrandsForType, getModelsForBrand } from "@/lib/vehicleData";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";

const SellVehicleFormPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({
    sellerName: "",
    phone: "",
    email: "",
    city: "",
    vehicleType: "car",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    fuelType: "petrol",
    transmission: "manual",
    kmDriven: "",
    expectedPrice: "",
    description: "",
    owners: "1",
  });

  const brandsList = getBrandsForType(form.vehicleType);
  const brandNames = brandsList.map(b => b.name);
  const modelsList = getModelsForBrand(form.vehicleType, form.brand);
  const modelNames = modelsList.map(m => m.name);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast({ title: "Maximum 5 images allowed", variant: "destructive" });
      return;
    }
    
    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);
    
    const previews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      return form.sellerName && form.phone && form.city;
    }
    if (step === 2) {
      return form.brand && form.model;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleSubmit = async () => {
    if (!form.sellerName || !form.phone || !form.brand || !form.model) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of images) {
        const fileName = `sell-requests/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from("vehicle-images")
          .upload(fileName, file);
        
        if (!error) {
          const { data: urlData } = supabase.storage
            .from("vehicle-images")
            .getPublicUrl(fileName);
          imageUrls.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase.from("leads").insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        lead_number: `SELL${Date.now().toString(36).toUpperCase()}`,
        customer_name: form.sellerName,
        phone: form.phone,
        email: form.email || null,
        source: "marketplace_sell",
        lead_type: "seller",
        vehicle_interest: `${form.year} ${form.brand} ${form.model}`,
        city: form.city || null,
        budget_min: form.expectedPrice ? parseFloat(form.expectedPrice.replace(/,/g, "")) : null,
        notes: JSON.stringify({
          type: "sell_request",
          vehicleType: form.vehicleType,
          brand: form.brand,
          model: form.model,
          year: form.year,
          fuelType: form.fuelType,
          transmission: form.transmission,
          kmDriven: form.kmDriven,
          expectedPrice: form.expectedPrice,
          owners: form.owners,
          description: form.description,
          images: imageUrls,
        }),
        status: "new",
        priority: "high",
      });

      if (error) throw error;

      setSubmitted(true);
      toast({ title: "Your vehicle listing request has been submitted!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white shadow-sm py-4">
          <div className="container mx-auto px-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">VahanHub</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Request Submitted!</h2>
            <p className="text-slate-600 mb-8">
              Our team will review your vehicle details and connect you with interested dealers within 24 hours.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/">
                <Button variant="outline">Back to Marketplace</Button>
              </Link>
              <Link to="/sell-vehicle">
                <Button className="bg-emerald-500 hover:bg-emerald-600">Sell Another Vehicle</Button>
              </Link>
            </div>
          </div>
        </div>

        <MarketplaceFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <Link to="/sell-vehicle" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <Car className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-slate-900">Sell Your Vehicle</span>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: 1, label: "Your Details" },
              { num: 2, label: "Vehicle Info" },
              { num: 3, label: "Photos & Submit" }
            ].map((step, i) => (
              <div key={step.num} className="flex items-center">
                <div className={`flex items-center gap-2 ${currentStep >= step.num ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= step.num 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {currentStep > step.num ? <CheckCircle className="h-5 w-5" /> : step.num}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
                </div>
                {i < 2 && <div className="w-12 md:w-24 h-0.5 bg-slate-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Your Details</h2>
                <p className="text-sm text-slate-500">Tell us how to reach you</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="Enter your name"
                  value={form.sellerName}
                  onChange={(e) => setForm({ ...form, sellerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email (Optional)</Label>
                <Input
                  placeholder="your@email.com"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  placeholder="Your city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>

            <Button 
              onClick={handleNext}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600"
            >
              Continue to Vehicle Details
            </Button>
          </div>
        )}

        {/* Step 2: Vehicle Details */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Car className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Vehicle Details</h2>
                <p className="text-sm text-slate-500">Tell us about your vehicle</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.vehicleType} onValueChange={(v) => setForm({ ...form, vehicleType: v, brand: "", model: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand *</Label>
                <Select value={form.brand} onValueChange={(v) => setForm({ ...form, brand: v, model: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="z-[200] bg-white max-h-60">
                    {brandNames.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="z-[200] bg-white max-h-60">
                    {modelNames.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={form.year.toString()} onValueChange={(v) => setForm({ ...form, year: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuel</Label>
                <Select value={form.fuelType} onValueChange={(v) => setForm({ ...form, fuelType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transmission</Label>
                <Select value={form.transmission} onValueChange={(v) => setForm({ ...form, transmission: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>KM Driven</Label>
                <Input
                  placeholder="e.g. 45000"
                  value={form.kmDriven}
                  onChange={(e) => setForm({ ...form, kmDriven: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Price (₹)</Label>
                <Input
                  placeholder="e.g. 5,00,000"
                  value={form.expectedPrice}
                  onChange={(e) => setForm({ ...form, expectedPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Owners</Label>
                <Select value={form.owners} onValueChange={(v) => setForm({ ...form, owners: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Owner</SelectItem>
                    <SelectItem value="2">2nd Owner</SelectItem>
                    <SelectItem value="3">3rd Owner</SelectItem>
                    <SelectItem value="4">4th+ Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                Continue to Photos
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Photos & Submit */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Camera className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Photos & Additional Info</h2>
                <p className="text-sm text-slate-500">Add photos to get better offers</p>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Vehicle Images (Max 5)</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-xs text-slate-500 mt-1">Add Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} multiple />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Details (Optional)</Label>
              <Textarea
                placeholder="Any modifications, accessories, or additional information about your vehicle..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                {submitting ? "Submitting..." : "Submit for Free Valuation"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default SellVehicleFormPage;
