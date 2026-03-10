import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type VehicleImage = Database["public"]["Tables"]["vehicle_images"]["Row"];
type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Document = Database["public"]["Tables"]["documents"]["Row"];

export interface VehiclePageData {
  vehicles: Vehicle[];
  vehicleImages: Record<string, VehicleImage[]>;
  vehicleDocs: Record<string, Document[]>;
  vendors: Vendor[];
  dealerName: string | null;
}

async function fetchVehiclePageData(): Promise<VehiclePageData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [vehiclesRes, vendorsRes, imagesRes, docsRes, settingsRes] = await Promise.all([
    supabase.from("vehicles").select("id, code, brand, model, variant, color, vehicle_type, condition, fuel_type, transmission, status, purchase_price, selling_price, strikeout_price, manufacturing_year, registration_number, registration_year, odometer_reading, mileage, seating_capacity, boot_space, engine_number, chassis_number, notes, vendor_id, user_id, is_public, public_page_id, public_description, public_highlights, public_features, marketplace_status, purchase_status, image_badge_text, image_badge_color, tyre_condition, battery_health, service_history, hypothecation, number_of_owners, insurance_expiry, puc_expiry, fitness_expiry, permit_expiry, road_tax_expiry, last_service_date, next_service_due, show_engine_number, show_chassis_number, created_at, updated_at, purchase_date").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("vendors").select("id, name, code, phone").eq("is_active", true).eq("user_id", user.id),
    supabase.from("vehicle_images").select("id, vehicle_id, image_url, is_primary, user_id, created_at").eq("user_id", user.id),
    supabase.from("documents").select("id, reference_id, document_name, document_type, document_url, status, expiry_date, notes, reference_type, updated_at, user_id, created_at").eq("reference_type", "vehicle").eq("user_id", user.id),
    supabase.from("settings").select("dealer_name").eq("user_id", user.id).maybeSingle(),
  ]);

  const imagesMap: Record<string, VehicleImage[]> = {};
  (imagesRes.data || []).forEach((img) => {
    if (!imagesMap[img.vehicle_id]) imagesMap[img.vehicle_id] = [];
    imagesMap[img.vehicle_id].push(img);
  });

  const docsMap: Record<string, Document[]> = {};
  (docsRes.data || []).forEach((doc) => {
    if (!docsMap[doc.reference_id]) docsMap[doc.reference_id] = [];
    docsMap[doc.reference_id].push(doc);
  });

  return {
    vehicles: (vehiclesRes.data || []) as Vehicle[],
    vehicleImages: imagesMap,
    vehicleDocs: docsMap,
    vendors: (vendorsRes.data || []) as Vendor[],
    dealerName: settingsRes.data?.dealer_name || null,
  };
}

export function useVehiclesPageData() {
  return useQuery({
    queryKey: ['vehicles-page'],
    queryFn: fetchVehiclePageData,
    staleTime: 2 * 60 * 1000,
  });
}

export function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['vehicles-page'] });
}
