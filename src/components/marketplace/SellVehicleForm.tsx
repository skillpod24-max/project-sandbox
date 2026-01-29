import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, CheckCircle, Car, MapPin, Phone, User, Mail, IndianRupee } from "lucide-react";
import { getBrandsForType, getModelsForBrand } from "@/lib/vehicleData";

interface SellVehicleFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const SellVehicleForm = ({ onSuccess, onClose }: SellVehicleFormProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

  const brands = getBrandsForType(form.vehicleType);
  const models = getModelsForBrand(form.vehicleType, form.brand);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast({ title: "Maximum 5 images allowed", variant: "destructive" });
      return;
    }
    
    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);
    
    // Generate previews
    const previews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (!form.sellerName || !form.phone || !form.brand || !form.model) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Upload images first
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

      // Create a lead for admin to see
      const { error } = await supabase.from("leads").insert({
        user_id: "00000000-0000-0000-0000-000000000000", // System/admin placeholder
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
      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">Request Submitted!</h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          Our team will review your vehicle details and connect you with interested dealers within 24 hours.
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      {/* Seller Info */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600" />
          Your Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Name *</Label>
            <Input
              placeholder="Your full name"
              value={form.sellerName}
              onChange={(e) => setForm({ ...form, sellerName: e.target.value })}
            />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label>City *</Label>
            <Input
              placeholder="Your city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
          <Car className="h-4 w-4 text-blue-600" />
          Vehicle Details
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
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
          <div>
            <Label>Brand *</Label>
            <Select value={form.brand} onValueChange={(v) => setForm({ ...form, brand: v, model: "" })}>
              <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
              <SelectContent>
                {brands.map(b => (
                  <SelectItem key={String(b)} value={String(b)}>{String(b)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Model *</Label>
            <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
              <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
              <SelectContent>
                {models.map(m => (
                  <SelectItem key={String(m)} value={String(m)}>{String(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
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
          <div>
            <Label>Fuel Type</Label>
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
          <div>
            <Label>Transmission</Label>
            <Select value={form.transmission} onValueChange={(v) => setForm({ ...form, transmission: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automatic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>KM Driven</Label>
            <Input
              placeholder="e.g. 45000"
              value={form.kmDriven}
              onChange={(e) => setForm({ ...form, kmDriven: e.target.value })}
            />
          </div>
          <div>
            <Label>Expected Price (₹)</Label>
            <Input
              placeholder="e.g. 5,00,000"
              value={form.expectedPrice}
              onChange={(e) => setForm({ ...form, expectedPrice: e.target.value })}
            />
          </div>
          <div>
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
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-900">Vehicle Images (Max 5)</h4>
        <div className="grid grid-cols-5 gap-2">
          {imagePreviews.map((preview, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="text-xs text-slate-500 mt-1">Add</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} multiple />
            </label>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label>Additional Details</Label>
        <Textarea
          placeholder="Any additional information about your vehicle..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={submitting} 
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {submitting ? "Submitting..." : "Submit Vehicle for Sale"}
      </Button>
    </div>
  );
};

export default SellVehicleForm;
