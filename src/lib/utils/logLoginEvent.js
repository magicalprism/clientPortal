// src/lib/utils/logLoginEvent.js

import { createClient } from "@/lib/supabase/browser";

export async function logLoginEvent({ type, ip, userAgent }) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("❌ Auth error:", authError);
    return;
  }

  const { data: contact, error: contactError } = await supabase
    .from("contact")
    .select("id")
    .eq("email", user.email)
    .single();

  if (contactError || !contact) {
    console.error("❌ Contact fetch error:", contactError);
    return;
  }

  const { error: insertError } = await supabase.from("login_events").insert({
    contact_id: contact.id,
    type,
    ip,
    user_agent: userAgent,
  });

  if (insertError) {
    console.error("❌ Insert error:", insertError);
  } else {
    console.log("✅ Login event logged");
  }
}
