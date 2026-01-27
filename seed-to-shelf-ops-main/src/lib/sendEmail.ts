import { supabase } from "@/integrations/supabase/client";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(input: SendEmailInput) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: input,
  });

  if (error) {
    console.error("Email failed:", error);
    throw error;
  }

  return data;
}
