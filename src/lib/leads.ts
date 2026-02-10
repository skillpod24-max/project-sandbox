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
    throw new Error("Failed to create lead");
  }

  // 3️⃣ Send email to dealer (only if email is configured)
  if (!settingsError && settings?.dealer_email) {
    try {
      await sendEmail({
        to: settings.dealer_email,
        subject: `🚗 New ${source === "marketplace" ? "Marketplace" : "Catalogue"} Enquiry - ${customerName}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">🚗 VahanHub</h1>
              <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">New ${source === "marketplace" ? "Marketplace" : "Catalogue"} Enquiry</p>
            </div>
            <div style="padding: 24px;">
              <div style="background: #ffffff; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 16px; color: #1e293b; font-size: 16px;">👤 Customer Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 110px;">Name</td><td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${customerName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Phone</td><td style="padding: 8px 0; color: #1e293b;"><a href="tel:${phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${phone}</a></td></tr>
                  ${email ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></td></tr>` : ""}
                  ${city ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">City</td><td style="padding: 8px 0; color: #1e293b;">${city}</td></tr>` : ""}
                </table>
              </div>
              ${vehicleInterest ? `
              <div style="background: #ffffff; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 8px; color: #1e293b; font-size: 16px;">🚘 Vehicle Interest</h3>
                <p style="margin: 0; color: #1e293b; font-weight: 600; font-size: 15px;">${vehicleInterest}</p>
              </div>` : ""}
              ${notes ? `
              <div style="background: #ffffff; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 8px; color: #1e293b; font-size: 16px;">💬 Message</h3>
                <p style="margin: 0; color: #475569; line-height: 1.6; white-space: pre-wrap;">${notes}</p>
              </div>` : ""}
              <div style="text-align: center; margin-top: 24px;">
                <a href="tel:${phone}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">📞 Call Customer Now</a>
              </div>
              <div style="text-align: center; margin-top: 16px;">
                <span style="display: inline-block; background: ${source === "marketplace" ? "#dbeafe" : "#dcfce7"}; color: ${source === "marketplace" ? "#1d4ed8" : "#166534"}; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;">${source === "marketplace" ? "Marketplace" : "Catalogue"}</span>
              </div>
              <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 20px;">
                This is an automated notification from VahanHub • ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't throw - lead was created successfully, email is secondary
    }
  } else {
    console.warn("Dealer email not configured, skipping email notification");
  }
}
