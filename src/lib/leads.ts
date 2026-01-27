import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import type { TablesInsert } from "@/integrations/supabase/types";

type CreatePublicLeadInput = {
  dealerUserId: string;
  customerName: string;
  phone: string;
  email?: string;
  notes?: string;
  city?: string;
  vehicleInterest?: string;
  source: "public_dealer_page" | "public_vehicle_page" | "website" | "marketplace";
  lead_type?: "buying" | "selling";
};

export async function createPublicLead({
  dealerUserId,
  customerName,
  phone,
  email,
  notes,
  city,
  vehicleInterest,
  source,
  lead_type, // ✅ ADD THIS
  
}: CreatePublicLeadInput) {
  // 1️⃣ Fetch dealer settings (email, name)
  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("dealer_email, dealer_name")
    .eq("user_id", dealerUserId)
    .single();

  if (settingsError || !settings?.dealer_email) {
    console.error("Dealer email not configured");
    return;
  }

  // 2️⃣ Prepare lead insert (STRICTLY MATCHING DB)
  const leadData: TablesInsert<"leads"> = {
    user_id: dealerUserId,
    customer_name: customerName,
    phone,
    email: email ?? null,
    notes: notes ?? null,
    city: city ?? null,
    vehicle_interest: vehicleInterest ?? null,
    source,
    lead_type: lead_type ?? "buying",
    status: "new",
    priority: "medium",
    lead_number: `LEAD-${Date.now()}`,
  };

  const { error: leadError } = await supabase
    .from("leads")
    .insert(leadData);

  if (leadError) {
    console.error("Failed to create lead", leadError);
    return;
  }

  // 3️⃣ Send email to dealer
  await sendEmail({
    to: settings.dealer_email,
    subject: "🚗 New Enquiry Received",
    html: `
      <h2>New Enquiry</h2>
      <p><b>Dealer:</b> ${settings.dealer_name ?? "-"}</p>
      <p><b>Name:</b> ${customerName}</p>
      <p><b>Phone:</b> ${phone}</p>
      ${email ? `<p><b>Email:</b> ${email}</p>` : ""}
      ${vehicleInterest ? `<p><b>Vehicle:</b> ${vehicleInterest}</p>` : ""}
      ${notes ? `<p><b>Message:</b> ${notes}</p>` : ""}
      <p><b>Source:</b> ${source}</p>
    `,
  });
}
