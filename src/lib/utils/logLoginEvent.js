// src/lib/utils/logLoginEvent.js

import { createClient } from "@/lib/supabase/browser";
import { logLoginEvent as insertLoginEvent } from "@/lib/supabase/queries/table/event_login";

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

  // Use the query function instead of direct Supabase query
  const { error: insertError } = await insertLoginEvent(contact.id, type, {
    ip,
    user_agent: userAgent,
  });

  if (insertError) {
    console.error("❌ Insert error:", insertError);
  } else {
    console.log("✅ Login event logged");
  }
}
